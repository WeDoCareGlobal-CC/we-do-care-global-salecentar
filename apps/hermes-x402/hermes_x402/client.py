"""x402 client: pay for a resource and retry with a signed authorization.

Implements the four-step flow from the specification overview:
request -> 402 with requirements -> sign an EIP-3009 authorization -> resend
with X-PAYMENT, then decode X-PAYMENT-RESPONSE.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

import httpx

from .eip3009 import Authorization, authorization_digest, build_authorization, usdc_domain
from .eip712 import Signature, sign_digest
from .networks import NetworkConfig, resolve_network
from .types import (
    PAYMENT_HEADER,
    PAYMENT_RESPONSE_HEADER,
    PaymentPayload,
    PaymentRequiredResponse,
    PaymentRequirements,
    X402Error,
)


@dataclass
class X402Response:
    status_code: int
    body: Any
    settlement: dict[str, Any] | None
    payer: str | None = None


class X402Client:
    """A paid-resource client backed by a local secp256k1 key.

    The private key is held in memory only; this is a reference client, not a
    production wallet.
    """

    def __init__(
        self,
        private_key: str,
        *,
        network: str = "base-sepolia",
        max_spend_atomic: int = 10_000_000,
        timeout: float = 30.0,
    ) -> None:
        from .eip712 import address_from_private_key

        self.private_key = private_key if private_key.startswith("0x") else "0x" + private_key
        self.address = address_from_private_key(self.private_key)
        self.network = resolve_network(network)
        if self.network is None:
            raise X402Error("invalid_network", f"unknown network {network!r}")
        self.max_spend_atomic = max_spend_atomic
        self.timeout = timeout
        self.total_spent_atomic = 0

    # -- signing -------------------------------------------------------

    def sign_payment(
        self,
        requirements: PaymentRequirements,
        *,
        amount_atomic: int | None = None,
        window_seconds: int = 60,
    ) -> PaymentPayload:
        """Build and sign a PaymentPayload for these requirements."""
        amount = requirements.amount if amount_atomic is None else amount_atomic
        if amount < requirements.amount:
            raise X402Error("invalid_exact_evm_payload_authorization_value", " underpaying")

        if self.total_spent_atomic + amount > self.max_spend_atomic:
            raise X402Error("insufficient_funds", "client budget exhausted")

        authorization = build_authorization(
            from_address=self.address,
            to_address=requirements.pay_to,
            value=amount,
            window_seconds=window_seconds,
        )
        domain = usdc_domain(
            chain_id=self.network.chain_id,
            asset=requirements.asset,
            name=self.network.usdc_name,
            version=self.network.usdc_version,
        )
        signature = sign_digest(authorization_digest(domain, authorization), self.private_key)
        return PaymentPayload(
            scheme=requirements.scheme,
            network=requirements.network,
            payload={
                "signature": signature.to_hex(),
                "authorization": authorization.to_wire(),
            },
        )

    # -- requests ------------------------------------------------------

    def fetch(
        self,
        method: str,
        url: str,
        *,
        amount_atomic: int | None = None,
        client: httpx.Client | None = None,
    ) -> X402Response:
        """Make a request, transparently paying the 402 challenge."""
        owns_client = client is None
        http = client or httpx.Client(timeout=self.timeout)
        try:
            response = http.request(method, url)

            if response.status_code != 402:
                return X402Response(
                    status_code=response.status_code,
                    body=_safe_json(response),
                    settlement=_decode_settlement(response),
                    payer=self.address,
                )

            challenge = PaymentRequiredResponse.from_wire(_require_json(response))
            if not challenge.accepts:
                raise X402Error("invalid_payment_requirements", "402 carried no acceptable terms")

            requirements = _select(challenge.accepts, self.network)
            payload = self.sign_payment(requirements, amount_atomic=amount_atomic)

            paid = http.request(
                method,
                url,
                headers={PAYMENT_HEADER: payload.to_header()},
            )
            self.total_spent_atomic += requirements.amount
            return X402Response(
                status_code=paid.status_code,
                body=_safe_json(paid),
                settlement=_decode_settlement(paid),
                payer=self.address,
            )
        finally:
            if owns_client:
                http.close()


def _select(
    accepts: list[PaymentRequirements], network: NetworkConfig
) -> PaymentRequirements:
    """Pick the requirement on our network."""
    for item in accepts:
        if item.scheme == "exact":
            resolved = resolve_network(item.network)
            if resolved is not None and resolved.chain_id == network.chain_id:
                return item
    raise X402Error("invalid_network", f"no requirement offered on {network.name}")


def _require_json(response: httpx.Response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError as exc:
        raise X402Error("invalid_payment_requirements", "402 body was not JSON") from exc
    if not isinstance(data, dict):
        raise X402Error("invalid_payment_requirements", "402 body was not an object")
    return data


def _safe_json(response: httpx.Response) -> Any:
    try:
        return response.json()
    except ValueError:
        return response.text


def _decode_settlement(response: httpx.Response) -> dict[str, Any] | None:
    """Decode X-PAYMENT-RESPONSE if present."""
    header = response.headers.get(PAYMENT_RESPONSE_HEADER)
    if not header:
        return None
    import base64

    try:
        return json.loads(base64.b64decode(header, validate=True))
    except Exception:  # noqa: BLE001 - a malformed receipt must not mask the body
        return None