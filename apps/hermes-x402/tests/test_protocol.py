"""End-to-end x402 flow against a real HTTP server.

Starts the actual FastAPI app on a real port and drives it with the actual
client, so the 402 challenge, X-PAYMENT header, settlement receipt and ledger
are all exercised over the wire rather than mocked.
"""

from __future__ import annotations

import json
import socket
import sys
import time
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import httpx
import uvicorn

from hermes_x402.client import X402Client
from hermes_x402.demo_resources import default_resources
from hermes_x402.ledger import Ledger
from hermes_x402.networks import BASE_SEPOLIA
from hermes_x402.server import X402Server
from hermes_x402.types import PAYMENT_HEADER, PaymentRequiredResponse

PURCHASER_KEY = "0x" + "22" * 32
FREE_PORT_CLIENT_KEY = "0x" + "33" * 32


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


class Harness:
    """Runs the server on a background thread for the duration of a test."""

    def __init__(self) -> None:
        self.ledger = Ledger()
        self.server = X402Server(default_resources(), ledger=self.ledger)
        self.port = _free_port()
        self.base = f"http://127.0.0.1:{self.port}"
        config = uvicorn.Config(self.server.app, host="127.0.0.1", port=self.port, log_level="error")
        self._server = uvicorn.Server(config)
        import threading

        self._thread = threading.Thread(target=self._server.run, daemon=True)
        self._thread.start()
        deadline = time.time() + 20
        while time.time() < deadline:
            if getattr(self._server, "started", False):
                return
            time.sleep(0.05)
        raise RuntimeError("server did not start")

    def close(self) -> None:
        self._server.should_exit = True
        self._thread.join(timeout=10)
        self.ledger.close()

    # -- request helpers used by the robustness suite -------------------

    def client_get(self, path: str, headers: dict[str, str] | None = None) -> httpx.Response:
        """Single request, no payment retry."""
        return httpx.get(f"{self.base}{path}", headers=headers, timeout=10)

    def httpx_client(self):
        """A client bound to this harness' base URL."""
        return httpx.Client(base_url=self.base, timeout=10)


def test_402_challenge_exposes_spec_shaped_terms() -> None:
    harness = Harness()
    try:
        response = httpx.get(f"{harness.base}/v1/insight", timeout=10)
        assert response.status_code == 402
        body = response.json()
        assert body["x402Version"] == 1
        assert body["error"]
        accepts = body["accepts"]
        assert len(accepts) == 1

        terms = accepts[0]
        assert terms["scheme"] == "exact"
        assert terms["network"] == BASE_SEPOLIA.name
        assert terms["maxAmountRequired"] == "10000"
        assert terms["asset"].lower() == BASE_SEPOLIA.usdc_asset.lower()
        assert terms["payTo"].lower() == harness.server.pay_to.lower()
        assert terms["resource"] == "/v1/insight"
        assert terms["maxTimeoutSeconds"] > 0
        # Every field the spec marks required must be present.
        for field in ("scheme", "network", "maxAmountRequired", "asset", "payTo",
                      "resource", "description", "maxTimeoutSeconds"):
            assert field in terms, field
    finally:
        harness.close()


def test_client_pays_and_receives_content() -> None:
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        result = client.fetch("GET", f"{harness.base}/v1/insight")
        assert result.status_code == 200, result.body
        assert result.body["confidence"] > 0

        # Receipt proves settlement happened and names the payer.
        assert result.settlement is not None
        assert result.settlement["success"] is True
        assert result.settlement["network"] == BASE_SEPOLIA.name
        assert result.settlement["payer"].lower() == client.address.lower()
        assert result.settlement["transaction"].startswith("0x")

        summary = harness.ledger.summary()
        assert summary.successful == 1
        assert summary.gross_usdc == Decimal("0.01")
    finally:
        harness.close()


def test_profit_accumulates_across_tiers() -> None:
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        for path in ("/v1/insight", "/v1/market-snapshot", "/v1/risk-report"):
            result = client.fetch("GET", f"{harness.base}{path}")
            assert result.status_code == 200, (path, result.body)

        summary = harness.ledger.summary()
        assert summary.successful == 3
        # 0.01 + 0.05 + 0.25
        assert summary.gross_usdc == Decimal("0.31")

        by_resource = {row["resource"]: row for row in harness.ledger.revenue_by_resource()}
        assert Decimal(str(by_resource["/v1/risk-report"]["revenue_usdc"])) == Decimal("0.25")
        assert harness.ledger.unique_payers() == 1
    finally:
        harness.close()


def test_nonce_replay_is_rejected() -> None:
    """Replaying a settled authorization must not credit revenue twice."""
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        with httpx.Client(timeout=10) as http:
            challenge = PaymentRequiredResponse.from_wire(http.get(f"{harness.base}/v1/insight").json())
            requirements = challenge.accepts[0]

            payload = client.sign_payment(requirements)
            header = payload.to_header()

            first = http.get(f"{harness.base}/v1/insight", headers={PAYMENT_HEADER: header})
            assert first.status_code == 200
            assert harness.ledger.summary().successful == 1

            replay = http.get(f"{harness.base}/v1/insight", headers={PAYMENT_HEADER: header})
            assert replay.status_code == 402
            assert harness.ledger.summary().successful == 1, "replay was credited twice"
            assert "replay" in replay.json()["error"]
    finally:
        harness.close()


def test_payment_to_wrong_wallet_is_rejected() -> None:
    """A signature is bound to the recipient; redirecting funds must fail."""
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        with httpx.Client(timeout=10) as http:
            challenge = PaymentRequiredResponse.from_wire(http.get(f"{harness.base}/v1/insight").json())
            requirements = challenge.accepts[0]

            from dataclasses import replace

            stolen = replace(requirements, pay_to="0x" + "de" * 20)
            payload = client.sign_payment(stolen)
            response = http.get(
                f"{harness.base}/v1/insight", headers={PAYMENT_HEADER: payload.to_header()}
            )
            assert response.status_code == 402
            assert "recipient_mismatch" in response.json()["error"]
            assert harness.ledger.summary().successful == 0
    finally:
        harness.close()


def test_client_refuses_to_sign_an_underpayment() -> None:
    """The client must not sign for less than the resource asks.

    Underpayment is rejected client-side on purpose: signing it would burn a
    nonce and produce a payload the server will refuse anyway.
    """
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        with httpx.Client(timeout=10) as http:
            challenge = PaymentRequiredResponse.from_wire(http.get(f"{harness.base}/v1/risk-report").json())
            requirements = challenge.accepts[0]  # 250_000

            from hermes_x402.types import X402Error

            try:
                client.sign_payment(requirements, amount_atomic=1_000)
            except X402Error as exc:
                assert exc.code == "invalid_exact_evm_payload_authorization_value"
            else:
                raise AssertionError("client signed an underpaying authorization")

            # And the server rejects one anyway if a caller bypasses the client.
            payload = client.sign_payment(requirements)
            tampered_auth = dict(payload.payload["authorization"])
            tampered_auth["value"] = "1000"

            from hermes_x402.types import PaymentPayload

            underpaid = PaymentPayload(
                scheme=payload.scheme, network=payload.network,
                payload={**payload.payload, "authorization": tampered_auth},
            )
            response = http.get(
                f"{harness.base}/v1/risk-report", headers={PAYMENT_HEADER: underpaid.to_header()}
            )
            assert response.status_code == 402
            assert "authorization_value" in response.json()["error"]
            assert harness.ledger.summary().successful == 0
    finally:
        harness.close()


def test_tampered_signature_is_rejected() -> None:
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        with httpx.Client(timeout=10) as http:
            challenge = PaymentRequiredResponse.from_wire(http.get(f"{harness.base}/v1/insight").json())
            requirements = challenge.accepts[0]
            payload = client.sign_payment(requirements)

            # Corrupt a byte inside r, leaving the signature well-formed so
            # the failure is a real signature mismatch rather than a parse error.
            signature = payload.payload["signature"]
            body, tail = signature[2:-2], signature[-2:]
            flipped = ("1" if body[0] != "1" else "2") + body[1:]
            tampered = {**payload.payload, "signature": "0x" + flipped + tail}
            from hermes_x402.types import PaymentPayload

            forged = PaymentPayload(scheme=payload.scheme, network=payload.network, payload=tampered)
            response = http.get(
                f"{harness.base}/v1/insight", headers={PAYMENT_HEADER: forged.to_header()}
            )
            assert response.status_code == 402
            assert "signature" in response.json()["error"]
    finally:
        harness.close()


def test_malformed_payment_header_returns_400() -> None:
    harness = Harness()
    try:
        response = httpx.get(
            f"{harness.base}/v1/insight",
            headers={PAYMENT_HEADER: "not-base64!!"},
            timeout=10,
        )
        assert response.status_code == 400
        assert "base64" in response.json()["error"].lower()
    finally:
        harness.close()


def test_expired_authorization_is_rejected() -> None:
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        with httpx.Client(timeout=10) as http:
            challenge = PaymentRequiredResponse.from_wire(http.get(f"{harness.base}/v1/insight").json())
            requirements = challenge.accepts[0]

            # Sign, then let the window lapse before presenting it.
            payload = client.sign_payment(requirements)
            auth = dict(payload.payload["authorization"])
            auth["validBefore"] = str(int(time.time()) - 10)
            auth["validAfter"] = str(int(time.time()) - 600)

            from hermes_x402.types import PaymentPayload

            stale = PaymentPayload(scheme=payload.scheme, network=payload.network,
                                   payload={**payload.payload, "authorization": auth})
            response = http.get(f"{harness.base}/v1/insight", headers={PAYMENT_HEADER: stale.to_header()})
            assert response.status_code == 402
            assert "valid" in response.json()["error"]
    finally:
        harness.close()


def test_client_budget_cap_stops_overspending() -> None:
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name, max_spend_atomic=50_000)
        assert client.fetch("GET", f"{harness.base}/v1/market-snapshot").status_code == 200
        # The next call would exceed the cap and must not be signed.
        from hermes_x402.types import X402Error

        try:
            client.fetch("GET", f"{harness.base}/v1/risk-report")
        except X402Error as exc:
            assert exc.code == "insufficient_funds"
        else:
            raise AssertionError("client exceeded its budget")
    finally:
        harness.close()


def test_discovery_lists_priced_resources() -> None:
    harness = Harness()
    try:
        body = httpx.get(f"{harness.base}/discovery/resources", timeout=10).json()
        assert body["x402Version"] == 1
        items = body["items"]
        assert len(items) == 3
        prices = sorted(item["metadata"]["price_usdc"] for item in items)
        assert prices == [0.01, 0.05, 0.25]
        for item in items:
            assert item["accepts"][0]["maxAmountRequired"]
    finally:
        harness.close()


def test_profit_summary_endpoint_reports_revenue() -> None:
    harness = Harness()
    try:
        client = X402Client(PURCHASER_KEY, network=BASE_SEPOLIA.name)
        client.fetch("GET", f"{harness.base}/v1/insight")
        client.fetch("GET", f"{harness.base}/v1/insight")

        body = httpx.get(f"{harness.base}/profit/summary", timeout=10).json()
        assert Decimal(body["gross_usdc"]) == Decimal("0.02")
        assert body["successful_settlements"] == 2
        assert body["unique_payers"] == 1
        assert len(body["by_resource"]) == 1
    finally:
        harness.close()


def test_separate_payers_are_counted_separately() -> None:
    harness = Harness()
    try:
        for key in (PURCHASER_KEY, FREE_PORT_CLIENT_KEY):
            client = X402Client(key, network=BASE_SEPOLIA.name)
            assert client.fetch("GET", f"{harness.base}/v1/insight").status_code == 200

        assert harness.ledger.summary().successful == 2
        assert harness.ledger.unique_payers() == 2
        top = harness.ledger.top_payers()
        assert len(top) == 2
    finally:
        harness.close()


def test_health_and_supported() -> None:
    harness = Harness()
    try:
        health = httpx.get(f"{harness.base}/health", timeout=10).json()
        assert health["status"] == "ok"

        supported = httpx.get(f"{harness.base}/supported", timeout=10).json()
        schemes = {kind["scheme"] for kind in supported["kinds"]}
        assert "exact" in schemes
    finally:
        harness.close()


if __name__ == "__main__":
    failures = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"PASS {name}")
            except Exception as exc:  # noqa: BLE001
                failures += 1
                print(f"FAIL {name}: {type(exc).__name__}: {exc}")
    print(f"\n{'all protocol tests pass' if not failures else f'{failures} failure(s)'}")
    sys.exit(1 if failures else 0)