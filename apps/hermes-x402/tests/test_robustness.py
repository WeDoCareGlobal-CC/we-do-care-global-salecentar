"""Malformed-input robustness.

Every path that parses untrusted input must fail closed with an x402 error
code, never an unhandled exception. The 402 path is reachable by anyone on the
internet, so a 500 there is a self-inflicted outage and an information leak.

These tests deliberately feed hostile input; each one asserts the server
answers with a clean status code and keeps serving afterwards.
"""

from __future__ import annotations

import base64
import json
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from test_protocol import Harness

from hermes_x402.types import PAYMENT_HEADER, PaymentPayload, PaymentRequiredResponse

KEY = "0x" + "44" * 32


def _header(payload: dict) -> str:
    return base64.b64encode(json.dumps(payload).encode()).decode()


def test_random_garbage_headers_do_not_crash() -> None:
    harness = Harness()
    try:
        random.seed(1337)
        # Base64 alphabet only. httpx correctly rejects spaces and CR/LF/tab
        # inside a header value (header-injection / smuggling vectors), so
        # the fuzz corpus stays within bytes that can legally be sent.
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        for attempt in range(40):
            raw = "".join(random.choice(alphabet) for _ in range(random.randint(1, 300)))
            response = harness.client_get("/v1/insight", headers={PAYMENT_HEADER: raw})
            assert response.status_code in (400, 402), (attempt, response.status_code)

        # Server still healthy after the abuse.
        assert harness.client_get("/health").status_code == 200
    finally:
        harness.close()


def test_header_injection_attempts_are_not_transmitted() -> None:
    """httpx must refuse CR/LF in header values; the server never sees them."""
    import httpx

    harness = Harness()
    try:
        for raw in ("abc\r\nX-Injected: 1", "abc\ndef", "abc\tdef"):
            try:
                httpx.get(f"{harness.base}/v1/insight", headers={PAYMENT_HEADER: raw}, timeout=10)
            except httpx.LocalProtocolError:
                pass  # correct: refused client-side
        assert harness.client_get("/health").status_code == 200
    finally:
        harness.close()


def test_structurally_valid_but_wrong_payloads_are_rejected() -> None:
    harness = Harness()
    try:
        cases = [
            {},
            {"x402Version": 1},
            {"x402Version": 1, "scheme": "exact", "network": "base-sepolia", "payload": {}},
            {"x402Version": 1, "scheme": "exact", "network": "base-sepolia", "payload": {"signature": "0x00"}},
            {
                "x402Version": 1,
                "scheme": "exact",
                "network": "base-sepolia",
                "payload": {"signature": "0x" + "11" * 65, "authorization": {"from": "0x1234"}},
            },
            {
                "x402Version": 2,
                "scheme": "exact",
                "network": "base-sepolia",
                "payload": {"signature": "0x" + "11" * 65, "authorization": {}},
            },
            {
                "x402Version": 1,
                "scheme": "made-up",
                "network": "base-sepolia",
                "payload": {"signature": "0x" + "11" * 65, "authorization": {}},
            },
            {
                "x402Version": 1,
                "scheme": "exact",
                "network": "not-a-network",
                "payload": {"signature": "0x" + "11" * 65, "authorization": {}},
            },
        ]
        for index, body in enumerate(cases):
            response = harness.client_get("/v1/insight", headers={PAYMENT_HEADER: _header(body)})
            assert response.status_code in (400, 402), (index, response.status_code, response.text)

        assert harness.ledger.summary().successful == 0
    finally:
        harness.close()


def test_wrong_length_nonce_and_bad_addresses() -> None:
    harness = Harness()
    try:
        variants = [
            {"nonce": "0xdeadbeef"},  # too short
            {"nonce": "zz" * 32},  # not hex
            {"from": "0xnothex", "to": "0xalsobad"},
        ]
        for variant in variants:
            auth = {
                "from": "0x" + "11" * 20,
                "to": harness.server.pay_to,
                "value": "10000",
                "validAfter": "0",
                "validBefore": "99999999999",
                "nonce": "0x" + "22" * 32,
            }
            auth.update(variant)
            body = {
                "x402Version": 1,
                "scheme": "exact",
                "network": "base-sepolia",
                "payload": {"signature": "0x" + "33" * 65, "authorization": auth},
            }
            response = harness.client_get("/v1/insight", headers={PAYMENT_HEADER: _header(body)})
            assert response.status_code in (400, 402), (variant, response.status_code)

        assert harness.client_get("/health").status_code == 200
    finally:
        harness.close()


def test_corrupted_signature_bytes_never_crash() -> None:
    """Regression: an off-curve r used to raise SquareRootError -> HTTP 500."""
    harness = Harness()
    try:
        with harness.httpx_client() as http:
            challenge = PaymentRequiredResponse.from_wire(http.get("/v1/insight").json())
            requirements = challenge.accepts[0]

            from hermes_x402.client import X402Client
            from hermes_x402.networks import BASE_SEPOLIA

            client = X402Client(KEY, network=BASE_SEPOLIA.name)
            payload = client.sign_payment(requirements)
            signature = payload.payload["signature"]
            r_part, s_part, v_part = signature[2:66], signature[66:130], signature[130:]

            # Replace r with values that are very unlikely to be valid x-coordinates.
            for candidate_r in ("00" * 32, "ff" * 32, "01" + "00" * 31, r_part[:-1] + ("0" if r_part[-1] != "0" else "1")):
                tampered = {
                    **payload.payload,
                    "signature": "0x" + candidate_r + s_part + v_part,
                }
                forged = PaymentPayload(
                    scheme=payload.scheme, network=payload.network, payload=tampered
                )
                response = http.get(
                    "/v1/insight", headers={PAYMENT_HEADER: forged.to_header()}
                )
                assert response.status_code in (400, 402), (candidate_r[:8], response.status_code)

        assert harness.ledger.summary().successful == 0
        assert harness.client_get("/health").status_code == 200
    finally:
        harness.close()


def test_oversized_value_and_negative_amounts_rejected() -> None:
    harness = Harness()
    try:
        auth_base = {
            "from": "0x" + "11" * 20,
            "to": harness.server.pay_to,
            "validAfter": "0",
            "validBefore": "99999999999",
            "nonce": "0x" + "22" * 32,
        }
        for value in ("0", "-1", "999999999999999999999999999999999999999999999999999999999999"):
            auth = {**auth_base, "value": value}
            body = {
                "x402Version": 1,
                "scheme": "exact",
                "network": "base-sepolia",
                "payload": {"signature": "0x" + "33" * 65, "authorization": auth},
            }
            response = harness.client_get("/v1/insight", headers={PAYMENT_HEADER: _header(body)})
            assert response.status_code in (400, 402), (value, response.status_code)
    finally:
        harness.close()


def test_base64_edge_cases() -> None:
    harness = Harness()
    try:
        for raw in ("", "=", "==", "not base64 at all!!", "e30", "//8=", "AAAA", "AAAAAAAA", "////"):
            response = harness.client_get("/v1/insight", headers={PAYMENT_HEADER: raw})
            assert response.status_code in (400, 402), (raw, response.status_code)
    finally:
        harness.close()


def test_json_array_body_is_rejected() -> None:
    harness = Harness()
    try:
        header = base64.b64encode(b"[1,2,3]").decode()
        response = harness.client_get("/v1/insight", headers={PAYMENT_HEADER: header})
        assert response.status_code == 400
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
    print(f"\n{'all robustness tests pass' if not failures else f'{failures} failure(s)'}")
    sys.exit(1 if failures else 0)