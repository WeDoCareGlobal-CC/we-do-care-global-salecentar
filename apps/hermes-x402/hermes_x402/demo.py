"""CLI demo buyer: fetches a paid endpoint end to end.

    python -m hermes_x402.demo --url http://127.0.0.1:8402/v1/insight

Prints the 402 terms, the payment it signed, and the content it bought.
"""

from __future__ import annotations

import argparse
import json
import sys

import httpx

from .client import X402Client
from .ledger import atomic_to_usdc
from .networks import resolve_network
from .types import PAYMENT_HEADER, PaymentRequiredResponse, X402Error

DEFAULT_KEY = "0x" + "22" * 32  # demo buyer key, public on purpose


def main() -> int:
    parser = argparse.ArgumentParser(description="Buy a resource with x402")
    parser.add_argument("--url", required=True, help="full URL of the paid endpoint")
    parser.add_argument("--key", default=DEFAULT_KEY, help="payer private key (hex)")
    parser.add_argument("--network", default="base-sepolia")
    parser.add_argument("--timeout", type=float, default=30.0)
    args = parser.parse_args()

    network = resolve_network(args.network)
    if network is None:
        print(f"unknown network {args.network!r}", file=sys.stderr)
        return 2

    with httpx.Client(timeout=args.timeout) as http:
        # Step 1: ask without paying and show the terms.
        challenge = http.get(args.url)
        if challenge.status_code != 402:
            print(f"expected 402, got {challenge.status_code}")
            print(challenge.text[:400])
            return 1

        terms = PaymentRequiredResponse.from_wire(challenge.json())
        requirement = terms.accepts[0]
        print(f"402 from {args.url}")
        print(f"  description {requirement.description}")
        print(f"  price       {atomic_to_usdc(requirement.amount, network.usdc_decimals)} USDC")
        print(f"  network     {requirement.network}")
        print(f"  asset       {requirement.asset}")
        print(f"  payTo       {requirement.pay_to}")
        print()

        # Step 2: sign and pay.
        client = X402Client(args.key, network=network.name, timeout=args.timeout)
        print(f"payer        {client.address}")

        try:
            payload = client.sign_payment(requirement)
        except X402Error as exc:
            print(f"refused to sign: {exc.code} {exc.message}", file=sys.stderr)
            return 1

        authorization = payload.payload["authorization"]
        print(f"  signature   {payload.payload['signature'][:26]}...")
        print(f"  pays        {authorization['to']}")
        print(f"  window      {authorization['validAfter']} .. {authorization['validBefore']}")
        print()

        paid = http.get(args.url, headers={PAYMENT_HEADER: payload.to_header()})
        if paid.status_code != 200:
            print(f"payment failed: HTTP {paid.status_code}")
            print(paid.text[:400])
            return 1

        settlement = None
        header = paid.headers.get("X-PAYMENT-RESPONSE")
        if header:
            import base64

            settlement = json.loads(base64.b64decode(header))

        print(f"200 paid {atomic_to_usdc(requirement.amount, network.usdc_decimals)} USDC")
        if settlement:
            print(f"  tx          {settlement.get('transaction')}")
            print(f"  payer       {settlement.get('payer')}")
        print()
        print("content:")
        print(json.dumps(paid.json(), indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())