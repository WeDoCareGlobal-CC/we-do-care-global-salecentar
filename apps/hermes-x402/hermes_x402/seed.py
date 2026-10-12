"""Seed realistic traffic against a running server so the dashboard has data.

Mixes legitimate purchases with deliberately bad payments, so the dashboard
shows both revenue and the rejection breakdown.

    python -m hermes_x402.seed --url http://127.0.0.1:8402
"""

from __future__ import annotations

import argparse
import sys
import time

import httpx

from .client import X402Client
from .networks import resolve_network
from .types import PAYMENT_HEADER, PaymentPayload, PaymentRequiredResponse

# Distinct demo payers so "unique payers" is non-trivial.
PAYER_KEYS = [
    "0x" + "a1" * 32,
    "0x" + "b2" * 32,
    "0x" + "c3" * 32,
    "0x" + "d4" * 32,
    "0x" + "e5" * 32,
]

PATHS = [
    ("/v1/insight", 8),
    ("/v1/market-snapshot", 5),
    ("/v1/risk-report", 3),
]


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed x402 demo traffic")
    parser.add_argument("--url", default="http://127.0.0.1:8402")
    parser.add_argument("--network", default="base-sepolia")
    parser.add_argument("--pause", type=float, default=0.0, help="delay between requests")
    parser.add_argument("--bad", action="store_true", help="also generate rejected payments")
    args = parser.parse_args()

    network = resolve_network(args.network)
    if network is None:
        print(f"unknown network {args.network!r}", file=sys.stderr)
        return 2

    base = args.url.rstrip("/")
    clients = [X402Client(key, network=network.name) for key in PAYER_KEYS]

    settled = 0
    print(f"seeding {base}")

    with httpx.Client(timeout=30.0) as http:
        health = http.get(f"{base}/health")
        if health.status_code != 200:
            print(f"server not healthy: HTTP {health.status_code}", file=sys.stderr)
            return 1
        print(f"  wallet {health.json()['wallet']}")

        for index, (path, count) in enumerate(PATHS):
            for n in range(count):
                client = clients[(index + n) % len(clients)]
                try:
                    result = client.fetch("GET", f"{base}{path}", client=http)
                except Exception as exc:  # noqa: BLE001
                    print(f"  {path}: {type(exc).__name__}: {exc}")
                    continue
                if result.status_code == 200:
                    settled += 1
                    payer = (result.settlement or {}).get("payer", "")
                    print(f"  paid {path} by {payer[:10]}…")
                else:
                    print(f"  FAILED {path} HTTP {result.status_code}")
                if args.pause:
                    time.sleep(args.pause)

        if args.bad:
            print("  generating rejected payments")
            rejected = _bad_payments(http, base, clients[0], network.name)
            print(f"  {rejected} rejected")

    print(f"done: {settled} settled")
    return 0


def _bad_payments(http: httpx.Client, base: str, client: X402Client, network: str) -> int:
    """Attempt several invalid payments; each should be refused and recorded."""
    count = 0
    challenge = http.get(f"{base}/v1/risk-report")
    if challenge.status_code != 402:
        return 0
    requirements = PaymentRequiredResponse.from_wire(challenge.json()).accepts[0]

    # 1. Corrupted signature.
    payload = client.sign_payment(requirements)
    signature = payload.payload["signature"]
    body, tail = signature[2:-2], signature[-2:]
    forged = {
        **payload.payload,
        "signature": "0x" + ("3" if body[0] != "3" else "4") + body[1:] + tail,
    }
    if _post(http, base, "/v1/risk-report", PaymentPayload(payload.scheme, payload.network, forged)).status_code in (400, 402):
        count += 1

    # 2. Payment redirected to a different wallet.
    payload = client.sign_payment(requirements)
    auth = dict(payload.payload["authorization"])
    auth["to"] = "0x" + "de" * 20
    redirected = PaymentPayload(payload.scheme, payload.network, {**payload.payload, "authorization": auth})
    if _post(http, base, "/v1/risk-report", redirected).status_code == 402:
        count += 1

    # 3. Expired authorization.
    payload = client.sign_payment(requirements)
    auth = dict(payload.payload["authorization"])
    auth["validBefore"] = str(int(time.time()) - 30)
    auth["validAfter"] = str(int(time.time()) - 600)
    stale = PaymentPayload(payload.scheme, payload.network, {**payload.payload, "authorization": auth})
    if _post(http, base, "/v1/risk-report", stale).status_code == 402:
        count += 1

    # 4. Malformed header.
    if http.get(f"{base}/v1/insight", headers={PAYMENT_HEADER: "not-valid-base64"}).status_code == 400:
        count += 1

    # 5. Replay of a legitimate payment.
    payload = client.sign_payment(requirements)
    header = payload.to_header()
    if _post(http, base, "/v1/risk-report", payload).status_code == 200:
        if _post(http, base, "/v1/risk-report", payload).status_code == 402:
            count += 1

    return count


def _post(http: httpx.Client, base: str, path: str, payload: PaymentPayload):
    return http.get(f"{base}{path}", headers={PAYMENT_HEADER: payload.to_header()})


if __name__ == "__main__":
    raise SystemExit(main())