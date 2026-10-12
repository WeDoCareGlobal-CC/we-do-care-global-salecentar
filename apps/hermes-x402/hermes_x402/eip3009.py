"""EIP-3009 TransferWithAuthorization: the x402 ``exact`` scheme on EVM.

An x402 ``exact`` payment is an EIP-3009 ``transferWithAuthorization``
signature. The payer signs an authorization off-chain; the facilitator
broadcasts it and pays the gas. The payer never needs a native gas token,
and the facilitator cannot alter the amount or the destination.
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass, asdict
from typing import Any

from .eip712 import Eip712Error, hash_typed_data

TRANSFER_WITH_AUTHORIZATION_TYPES = {
    "TransferWithAuthorization": [
        {"name": "from", "type": "address"},
        {"name": "to", "type": "address"},
        {"name": "value", "type": "uint256"},
        {"name": "validAfter", "type": "uint256"},
        {"name": "validBefore", "type": "uint256"},
        {"name": "nonce", "type": "bytes32"},
    ]
}

# Hard cap on how long an authorization stays valid, regardless of what a
# client asks for. The spec's error taxonomy has no "authorization lived too
# long" code, so an over-long window is a client bug we reject up front
# rather than a settlement failure later.
MAX_AUTHORIZATION_WINDOW_SECONDS = 600


@dataclass(frozen=True)
class Authorization:
    """EIP-3009 authorization fields as they appear on the wire."""

    from_address: str
    to_address: str
    value: int
    valid_after: int
    valid_before: int
    nonce: bytes

    def to_wire(self) -> dict[str, str]:
        """Serialise to the PaymentPayload shape (all values as strings)."""
        return {
            "from": self.from_address,
            "to": self.to_address,
            "value": str(self.value),
            "validAfter": str(self.valid_after),
            "validBefore": str(self.valid_before),
            "nonce": "0x" + self.nonce.hex(),
        }

    def to_eip712(self) -> dict[str, Any]:
        return {
            "from": self.from_address,
            "to": self.to_address,
            "value": self.value,
            "validAfter": self.valid_after,
            "validBefore": self.valid_before,
            "nonce": self.nonce,
        }

    @classmethod
    def from_wire(cls, data: dict[str, Any]) -> "Authorization":
        missing = {"from", "to", "value", "validAfter", "validBefore", "nonce"} - set(data)
        if missing:
            raise Eip712Error(f"authorization missing field(s): {', '.join(sorted(missing))}")
        nonce_raw = data["nonce"]
        nonce = bytes.fromhex(nonce_raw[2:] if isinstance(nonce_raw, str) and nonce_raw.startswith("0x") else nonce_raw)
        if len(nonce) != 32:
            raise Eip712Error("nonce must be 32 bytes")
        return cls(
            from_address=data["from"],
            to_address=data["to"],
            value=int(data["value"]),
            valid_after=int(data["validAfter"]),
            valid_before=int(data["validBefore"]),
            nonce=nonce,
        )


def usdc_domain(chain_id: int, asset: str, name: str = "USDC", version: str = "2") -> dict[str, Any]:
    """EIP-712 domain for a Circle-issued USDC-style EIP-3009 token."""
    return {
        "name": name,
        "version": version,
        "chainId": chain_id,
        "verifyingContract": asset,
    }


def authorization_digest(domain: dict[str, Any], authorization: Authorization | dict[str, Any]) -> bytes:
    """Return the 32-byte digest the payer signs."""
    message = authorization.to_eip712() if isinstance(authorization, Authorization) else authorization
    return hash_typed_data(domain, TRANSFER_WITH_AUTHORIZATION_TYPES, "TransferWithAuthorization", message)


def build_authorization(
    from_address: str,
    to_address: str,
    value: int,
    *,
    window_seconds: int = 60,
    clock_skew_seconds: int = 30,
    nonce: bytes | None = None,
) -> Authorization:
    """Create an authorization with a tight validity window.

    ``clock_skew_seconds`` back-dates ``validAfter`` because the facilitator's
    clock can trail the client's by a second or two; without it, legitimate
    payments intermittently fail the time-window check.
    """
    if window_seconds <= 0:
        raise ValueError("window_seconds must be positive")
    if window_seconds > MAX_AUTHORIZATION_WINDOW_SECONDS:
        raise ValueError(
            f"window_seconds must be <= {MAX_AUTHORIZATION_WINDOW_SECONDS} to bound replay exposure"
        )
    now = int(time.time())
    return Authorization(
        from_address=from_address,
        to_address=to_address,
        value=value,
        valid_after=now - clock_skew_seconds,
        valid_before=now + window_seconds,
        nonce=nonce if nonce is not None else os.urandom(32),
    )


def check_validity_window(authorization: Authorization, now: int | None = None) -> str | None:
    """Return an x402 error code if the authorization is outside its window."""
    moment = int(time.time()) if now is None else now
    if moment < authorization.valid_after:
        return "invalid_exact_evm_payload_authorization_valid_after"
    if moment > authorization.valid_before:
        return "invalid_exact_evm_payload_authorization_valid_before"
    return None


def authorization_to_dict(authorization: Authorization) -> dict[str, Any]:
    return asdict(authorization)