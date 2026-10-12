"""Paid workers that compute real results rather than returning fixtures.

Every endpoint here is *deterministic given its inputs* and does real work:
hashing, signing, verification, fee arithmetic, ledger aggregation. That matters
for x402 specifically -- the buyer is paying for a verifiable answer, so an
endpoint that returned a hardcoded blob would be worth nothing and would
undermine the protocol's whole premise.

Each worker returns a dict that FastAPI serialises as JSON. Prices are in USDC
atomic units (6 decimals), so 0.01 USDC = 10_000.
"""

from __future__ import annotations

import time
from typing import Any, Sequence

from .keccak import keccak256
from .ledger import Ledger, atomic_to_usdc
from .networks import BASE_SEPOLIA, NetworkConfig
from .server import PricedResource

# Facilitator economics (Coinbase CDP, documented pricing). Real settlement
# costs this per on-chain transaction above the free tier, so a seller that
# ignores it can end up paying more in fees than it earns.
FREE_TRANSACTIONS_PER_MONTH = 1_000
FEE_PER_TRANSACTION_USD = 0.001


def _hex_to_bytes(value: str) -> bytes:
    """Decode 0x-prefixed hex, tolerating odd length and whitespace."""
    cleaned = value.strip()
    if cleaned.lower().startswith("0x"):
        cleaned = cleaned[2:]
    cleaned = "".join(cleaned.split())
    if len(cleaned) % 2:
        cleaned = "0" + cleaned
    return bytes.fromhex(cleaned)


# ---------------------------------------------------------------- workers


def _keccak_digest(request) -> dict[str, Any]:
    """Keccak-256 of caller-supplied hex. A real, verifiable primitive."""
    payload = request.query_params.get("data", "")
    raw = _hex_to_bytes(payload) if payload else b""
    digest = keccak256(raw)
    return {
        "algorithm": "keccak-256",
        "input_bytes": len(raw),
        "digest": "0x" + digest.hex(),
    }


def _eip712_digest(request) -> dict[str, Any]:
    """EIP-712 hashStruct for caller-supplied typed data.

    Genuinely useful to a buyer that needs the exact digest another contract
    would compute, and impossible to guess without doing the work.
    """
    from .eip712 import hash_typed_data

    types_json = request.query_params.get("types", "")
    primary_type = request.query_params.get("primary_type", "")
    domain_json = request.query_params.get("domain", "")
    message_json = request.query_params.get("message", "{}")

    import json

    try:
        types = json.loads(types_json)
        domain = json.loads(domain_json) if domain_json else {}
        message = json.loads(message_json)
        digest = hash_typed_data(domain, types, primary_type, message)
    except Exception as exc:  # noqa: BLE001 - report the reason, do not 500
        return {"error": str(exc)[:200], "hint": "types, domain and message must be JSON"}

    return {
        "eip712": "hashStruct",
        "primary_type": primary_type,
        "digest": "0x" + digest.hex(),
    }


def _settlement_math(request) -> dict[str, Any]:
    """Unit economics for a given payment volume.

    Surfaces the thing that decides whether the x402 rail is profitable at all:
    facilitator fees versus revenue per call, and where the free tier runs out.
    """
    try:
        calls = int(request.query_params.get("calls", "1000"))
        price_usdc = float(request.query_params.get("price_usdc", "0.01"))
    except ValueError:
        return {"error": "calls and price_usdc must be numbers"}

    revenue = calls * price_usdc
    billable = max(0, calls - FREE_TRANSACTIONS_PER_MONTH)
    fees = billable * FEE_PER_TRANSACTION_USD

    return {
        "calls": calls,
        "price_usdc": price_usdc,
        "revenue_usdc": round(revenue, 6),
        "free_tier_calls": FREE_TRANSACTIONS_PER_MONTH,
        "billable_transactions": billable,
        "facilitator_fees_usd": round(fees, 6),
        "net_usd": round(revenue - fees, 6),
        "margin_pct": round(((revenue - fees) / revenue * 100), 4) if revenue else 0.0,
        "breakeven_price_usdc": round(FEE_PER_TRANSACTION_USD, 6),
        "note": "verification is always free; only on-chain settlement is billed",
    }


def _ledger_report(request) -> dict[str, Any]:
    """Revenue analytics derived from the real ledger.

    Reports what the endpoint owner has actually collected rather than a
    fixture, so it stays truthful as payments accumulate.
    """
    server = _server_or_none()
    ledger: Ledger | None = server.ledger if server else None
    if ledger is None:
        return {"error": "no ledger attached"}

    summary = ledger.summary()
    by_resource = ledger.revenue_by_resource()
    return {
        "gross_usdc": str(summary.gross_usdc),
        "successful_settlements": summary.successful,
        "rejected_payments": summary.rejected,
        "unique_payers": ledger.unique_payers(),
        "average_usdc": str(summary.average_usdc),
        "by_resource": by_resource,
        "generated_at": int(time.time()),
    }


def _capability_manifest(request) -> dict[str, Any]:
    """Advertise every paid endpoint and its price in one call.

    Lets a buyer price a whole workflow before spending anything, which is the
    discovery step an agent needs before it will commit funds.
    """
    server = _server_or_none()
    catalogue = list(server.resources) if server else []
    return {
        "x402_version": 1,
        "workers": [
            {
                "path": r.path,
                "description": r.description,
                "price_usdc": str(atomic_to_usdc(r.amount_atomic, r.network.usdc_decimals)),
                "price_atomic": r.amount_atomic,
                "network": r.network.caip2,
                "asset": r.network.usdc_asset,
            }
            for r in catalogue
        ],
        "settlement": "facilitator" if _is_facilitator_live() else "simulate",
        "generated_at": int(time.time()),
    }


def _is_facilitator_live() -> bool:
    server = _server_or_none()
    return server is not None and server.facilitator is not None


def _server_or_none():
    """Resolve the live server instance, or None when unavailable.

    Works because the server is launched with `python -m hermes_x402`, whose
    `__main__.py` imports `hermes_x402.server` by name. Running the module file
    directly instead (`python -m hermes_x402.server`) would execute it a second
    time under the name `__main__`, giving the handlers a different module
    object with its own empty global.
    """
    from .server import _active_server

    return _active_server()


def profit_workers(network: NetworkConfig = BASE_SEPOLIA) -> list[PricedResource]:
    """The paid catalogue. One tier per real unit of work."""
    return [
        PricedResource(
            path="/v1/keccak",
            description="Keccak-256 digest of caller-supplied hex",
            amount_atomic=2_000,  # 0.002 USDC
            handler=_keccak_digest,
            network=network,
        ),
        PricedResource(
            path="/v1/eip712-digest",
            description="EIP-712 hashStruct for caller-supplied typed data",
            amount_atomic=5_000,  # 0.005 USDC
            handler=_eip712_digest,
            network=network,
        ),
        PricedResource(
            path="/v1/settlement-math",
            description="Unit economics and facilitator fee break-even for a call volume",
            amount_atomic=10_000,  # 0.01 USDC
            handler=_settlement_math,
            network=network,
        ),
        PricedResource(
            path="/v1/manifest",
            description="Full worker catalogue with prices",
            amount_atomic=1_000,  # 0.001 USDC
            handler=_capability_manifest,
            network=network,
        ),
        PricedResource(
            path="/v1/revenue-report",
            description="Revenue analytics from the live settlement ledger",
            amount_atomic=25_000,  # 0.025 USDC
            handler=_ledger_report,
            network=network,
        ),
    ]


__all__ = ["profit_workers", "PricedResource", "Sequence"]
