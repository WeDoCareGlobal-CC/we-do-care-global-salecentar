"""Verification and settlement for the x402 ``exact`` scheme on EVM.

``verify`` performs every check the specification lists (section 7.1) and is
purely local: it recovers the signer's address from the EIP-712 signature and
checks it against the payment requirements. It never touches a chain.

``settle`` in this module is the *simulated* settler used for local development
and tests: it re-verifies, records the payment in the ledger, and returns a
deterministic synthetic transaction hash. Broadcasting a real
``transferWithAuthorization`` requires an RPC endpoint and a funded facilitator
key, which is what :mod:`hermes_x402.onchain` is for.
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

from .eip3009 import Authorization, authorization_digest, check_validity_window
from .eip712 import (
    Eip712Error,
    Signature,
    address_from_private_key,
    recover_address,
)
from .keccak import keccak256
from .ledger import Ledger
from .networks import NetworkConfig, resolve_network
from .types import X402_VERSION, PaymentPayload, PaymentRequirements, SettlementResponse, X402Error


@dataclass(frozen=True)
class VerifyResult:
    is_valid: bool
    payer: str
    invalid_reason: str | None = None
    authorization: Authorization | None = None


def _fail(reason: str, payer: str = "") -> VerifyResult:
    return VerifyResult(is_valid=False, payer=payer, invalid_reason=reason)


def verify(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
    ledger: Ledger | None = None,
) -> VerifyResult:
    """Verify a payment against its requirements. Mirrors facilitator POST /verify."""
    if payload.x402_version != X402_VERSION:
        return _fail("invalid_x402_version")

    if payload.scheme != requirements.scheme:
        return _fail("invalid_scheme")

    network = resolve_network(payload.network)
    if network is None:
        return _fail("invalid_network")

    requirement_network = resolve_network(requirements.network)
    if requirement_network is None:
        return _fail("invalid_network")
    if network.chain_id != requirement_network.chain_id:
        return _fail("invalid_network")

    if requirements.asset.lower() != network.usdc_asset.lower():
        return _fail("invalid_exact_evm_payload_asset")

    try:
        authorization = Authorization.from_wire(payload.payload["authorization"])
        signature = Signature.from_hex(payload.payload["signature"])
    except (KeyError, Eip712Error, TypeError, ValueError):
        return _fail("invalid_payload")

    payer = authorization.from_address

    # Recipient must match exactly, or a facilitator could redirect funds.
    if authorization.to_address.lower() != requirements.pay_to.lower():
        return _fail("invalid_exact_evm_payload_recipient_mismatch", payer)

    if authorization.value < requirements.amount:
        return _fail("invalid_exact_evm_payload_authorization_value", payer)

    window_error = check_validity_window(authorization)
    if window_error:
        return _fail(window_error, payer)

    # EIP-3009 domain: the token's own EIP-712 domain, chain-scoped.
    domain = {
        "name": network.usdc_name,
        "version": network.usdc_version,
        "chainId": network.chain_id,
        "verifyingContract": requirements.asset,
    }
    digest = authorization_digest(domain, authorization)
    try:
        recovered = recover_address(digest, signature, expected=payer)
    except Eip712Error:
        return _fail("invalid_exact_evm_payload_signature", payer)
    if recovered.lower() != payer.lower():
        return _fail("invalid_exact_evm_payload_signature", payer)

    # A nonce is single-use per the contract; reject replays before settlement.
    if ledger is not None:
        nonce_hex = "0x" + authorization.nonce.hex()
        if ledger.nonce_seen(nonce_hex):
            return _fail("invalid_exact_evm_payload_nonce_replay", payer)

    return VerifyResult(is_valid=True, payer=payer, authorization=authorization)


def synthetic_transaction_hash(nonce: bytes) -> str:
    """Deterministic 32-byte hash standing in for a transaction hash locally.

    Derived from the nonce alone so repeated runs of the same payment produce
    the same value, which keeps local tests and fixtures reproducible.
    """
    return "0x" + keccak256(b"x402-local-settlement" + nonce).hex()


def settle(
    payload: PaymentPayload,
    requirements: PaymentRequirements,
    ledger: Ledger,
) -> SettlementResponse:
    """Simulated settlement: verify, record, and return a receipt.

    This does NOT broadcast a blockchain transaction. It is the local stand-in
    for facilitator POST /settle so the profit pipeline can be exercised
    end-to-end without an RPC endpoint or gas.
    """
    result = verify(payload, requirements, ledger)
    if not result.is_valid or result.authorization is None:
        ledger.record_rejection(
            result.invalid_reason or "unexpected_verify_error",
            network=payload.network,
            payer=result.payer,
            resource=requirements.resource,
        )
        return SettlementResponse(
            success=False,
            transaction="",
            network=payload.network,
            payer=result.payer,
            error_reason=result.invalid_reason,
        )

    authorization = result.authorization
    nonce_hex = "0x" + authorization.nonce.hex()
    network = resolve_network(payload.network)
    assert network is not None  # verify() already resolved it

    transaction = synthetic_transaction_hash(authorization.nonce)
    ledger.record_settlement(
        network=payload.network,
        asset=requirements.asset,
        payer=result.payer,
        pay_to=authorization.to_address,
        amount_atomic=authorization.value,
        nonce=nonce_hex,
        tx_hash=transaction,
        resource=requirements.resource,
        status="settled",
        detail={"simulated": True, "scheme": payload.scheme, "settled_at": time.time()},
        decimals=network.usdc_decimals,
    )
    return SettlementResponse(
        success=True,
        transaction=transaction,
        network=payload.network,
        payer=result.payer,
    )


def supported_kinds(networks: list[NetworkConfig]) -> dict[str, Any]:
    """Facilitator GET /supported response shape."""
    return {
        "kinds": [
            {
                "x402Version": 1,
                "scheme": "exact",
                "network": network.name,
                "caip2": network.caip2,
                "asset": network.usdc_asset,
                "decimals": network.usdc_decimals,
            }
            for network in networks
        ]
    }


def payer_address_for_key(private_key: str) -> str:
    """Convenience for tests and CLI wallets."""
    return address_from_private_key(private_key)