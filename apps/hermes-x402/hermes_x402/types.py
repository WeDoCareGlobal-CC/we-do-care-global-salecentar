"""x402 wire types: PaymentRequirements, PaymentPayload, SettlementResponse.

Field names and string encodings follow x402 specification v1 exactly
(sections 5.1-5.3) and the HTTP transport spec. Amounts are decimal strings in
the asset's atomic units, never JSON numbers, to avoid float64 rounding.
"""

from __future__ import annotations

import base64
import json
from dataclasses import dataclass, field
from typing import Any

X402_VERSION = 1

# Header names per the HTTP transport spec.
PAYMENT_HEADER = "X-PAYMENT"
PAYMENT_RESPONSE_HEADER = "X-PAYMENT-RESPONSE"


class X402Error(Exception):
    """Protocol-level failure carrying an x402 error code."""

    def __init__(self, code: str, message: str = "") -> None:
        super().__init__(message or code)
        self.code = code
        self.message = message or code


@dataclass(frozen=True)
class PaymentRequirements:
    """One acceptable way to pay for a resource."""

    scheme: str
    network: str
    max_amount_required: str
    asset: str
    pay_to: str
    resource: str
    description: str
    max_timeout_seconds: int = 60
    mime_type: str = "application/json"
    output_schema: dict[str, Any] | None = None
    extra: dict[str, Any] | None = None

    @property
    def amount(self) -> int:
        return int(self.max_amount_required)

    def to_wire(self) -> dict[str, Any]:
        return {
            "scheme": self.scheme,
            "network": self.network,
            "maxAmountRequired": self.max_amount_required,
            "asset": self.asset,
            "payTo": self.pay_to,
            "resource": self.resource,
            "description": self.description,
            "mimeType": self.mime_type,
            "outputSchema": self.output_schema,
            "maxTimeoutSeconds": self.max_timeout_seconds,
            "extra": self.extra,
        }

    @classmethod
    def from_wire(cls, data: dict[str, Any]) -> "PaymentRequirements":
        return cls(
            scheme=data["scheme"],
            network=data["network"],
            max_amount_required=str(data["maxAmountRequired"]),
            asset=data["asset"],
            pay_to=data["payTo"],
            resource=data["resource"],
            description=data["description"],
            max_timeout_seconds=int(data.get("maxTimeoutSeconds", 60)),
            mime_type=data.get("mimeType", "application/json"),
            output_schema=data.get("outputSchema"),
            extra=data.get("extra"),
        )


@dataclass(frozen=True)
class PaymentPayload:
    """The client's signed payment authorization."""

    scheme: str
    network: str
    payload: dict[str, Any]
    x402_version: int = X402_VERSION

    def to_wire(self) -> dict[str, Any]:
        return {
            "x402Version": self.x402_version,
            "scheme": self.scheme,
            "network": self.network,
            "payload": self.payload,
        }

    def to_header(self) -> str:
        """Encode for the X-PAYMENT header: base64 of compact JSON."""
        raw = json.dumps(self.to_wire(), separators=(",", ":")).encode("utf-8")
        return base64.b64encode(raw).decode("ascii")

    @classmethod
    def from_wire(cls, data: dict[str, Any]) -> "PaymentPayload":
        missing = {"scheme", "network", "payload"} - set(data)
        if missing:
            raise X402Error(
                "invalid_payload",
                f"PaymentPayload missing field(s): {', '.join(sorted(missing))}",
            )
        if not isinstance(data["payload"], dict):
            raise X402Error("invalid_payload", "payload must be an object")
        return cls(
            scheme=data["scheme"],
            network=data["network"],
            payload=data["payload"],
            x402_version=int(data.get("x402Version", X402_VERSION)),
        )

    @classmethod
    def from_header(cls, header: str) -> "PaymentPayload":
        try:
            raw = base64.b64decode(header, validate=True)
        except Exception as exc:  # noqa: BLE001 - any decode failure is the same 400
            raise X402Error("invalid_payload", "X-PAYMENT is not valid base64") from exc
        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise X402Error("invalid_payload", "X-PAYMENT is not valid JSON") from exc
        if not isinstance(data, dict):
            raise X402Error("invalid_payload", "X-PAYMENT must be a JSON object")
        try:
            return cls.from_wire(data)
        except X402Error:
            raise
        except (TypeError, ValueError) as exc:
            # x402Version can be any JSON type; a string or null must not
            # surface as a 500.
            raise X402Error("invalid_payload", "PaymentPayload is malformed") from exc


@dataclass(frozen=True)
class SettlementResponse:
    """The server's settlement receipt, returned in X-PAYMENT-RESPONSE."""

    success: bool
    transaction: str
    network: str
    payer: str
    error_reason: str | None = None

    def to_wire(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "success": self.success,
            "transaction": self.transaction,
            "network": self.network,
            "payer": self.payer,
        }
        if self.error_reason:
            data["errorReason"] = self.error_reason
        return data

    def to_header(self) -> str:
        raw = json.dumps(self.to_wire(), separators=(",", ":")).encode("utf-8")
        return base64.b64encode(raw).decode("ascii")


@dataclass
class PaymentRequiredResponse:
    """The 402 body: why payment is needed and what is accepted."""

    error: str
    accepts: list[PaymentRequirements] = field(default_factory=list)
    x402_version: int = X402_VERSION

    def to_wire(self) -> dict[str, Any]:
        return {
            "x402Version": self.x402_version,
            "error": self.error,
            "accepts": [requirement.to_wire() for requirement in self.accepts],
        }

    @classmethod
    def from_wire(cls, data: dict[str, Any]) -> "PaymentRequiredResponse":
        return cls(
            error=data.get("error", ""),
            accepts=[PaymentRequirements.from_wire(item) for item in data.get("accepts", [])],
            x402_version=int(data.get("x402Version", X402_VERSION)),
        )


def pick_requirement(
    response: PaymentRequiredResponse,
    *,
    scheme: str = "exact",
    network: str | None = None,
) -> PaymentRequirements:
    """Choose a requirement matching scheme (and network when given)."""
    candidates = [
        item
        for item in response.accepts
        if item.scheme == scheme and (network is None or item.network == network)
    ]
    if not candidates:
        raise X402Error(
            "unsupported_scheme",
            f"no acceptable requirement for scheme={scheme} network={network}",
        )
    return candidates[0]