"""Call the real CDP x402 facilitator /verify endpoint.

This is the end-to-end proof that the credentials work: our JWT plus a real
EIP-3009 authorization must come back valid. Anything else means settlement is
not live. Never prints secret material.
"""

import os

from hermes_x402.client import X402Client
from hermes_x402.networks import BASE_SEPOLIA
from hermes_x402.onchain import FacilitatorClient, FacilitatorConfig
from hermes_x402.types import PaymentRequirements


def main() -> int:
    config = FacilitatorConfig.from_env()
    if config is None:
        print("no CDP credentials in environment")
        return 2

    network = BASE_SEPOLIA
    client = X402Client(
        private_key=os.environ.get("X402_PRIVATE_KEY", "0x" + "11" * 32),
        network=network.name,
        max_spend_atomic=10_000,
    )

    # The facilitator rejects a self-send, so pay a different address than the
    # payer signs with.
    pay_to = os.environ.get("X402_PAY_TO", "0x" + "22" * 20)

    requirements = PaymentRequirements(
        scheme="exact",
        network=network.caip2,
        max_amount_required="1000",
        resource="https://example.test/probe",
        description="connectivity probe",
        mime_type="application/json",
        pay_to=pay_to,
        max_timeout_seconds=60,
        asset=network.usdc_asset,
    )

    payload = client.sign_payment(requirements, amount_atomic=1000)
    print(f"facilitator : {config.url}")
    print(f"payer       : {client.address}")

    facilitator = FacilitatorClient(config)
    try:
        result = facilitator.verify(payload, requirements)
    except Exception as exc:
        print(f"VERIFY FAILED -> {type(exc).__name__}: {exc}")
        return 1
    print("verify result:", result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())