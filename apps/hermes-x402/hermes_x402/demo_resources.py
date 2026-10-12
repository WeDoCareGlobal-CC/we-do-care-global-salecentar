"""The demo catalogue of paid endpoints.

Prices are in USDC atomic units (6 decimals): 0.01 USDC = 10_000.
"""

from __future__ import annotations

import time
from typing import Sequence

from .networks import BASE_SEPOLIA
from .server import PricedResource


def _insight(request):  # noqa: ANN001 - FastAPI handler
    return {
        "insight": "Autonomous agent fleets monetise per-call, not per-seat.",
        "confidence": 0.82,
        "signals": 14,
        "generated_at": int(time.time()),
    }


def _market_snapshot(request):  # noqa: ANN001
    return {
        "pair": "ETH/USDC",
        "price": 3142.55,
        "spread_bps": 4,
        "venue_depth_usdc": 1_250_000,
        "generated_at": int(time.time()),
    }


def _risk_report(request):  # noqa: ANN001
    return {
        "score": 23,
        "band": "low",
        "factors": ["stablecoin settlement", "testnet only", "single-signer wallet"],
        "generated_at": int(time.time()),
    }


def default_resources() -> list[PricedResource]:
    """Endpoints priced to demonstrate a few payment tiers."""
    return [
        PricedResource(
            path="/v1/insight",
            description="One-shot market insight",
            amount_atomic=10_000,  # 0.01 USDC
            handler=_insight,
            network=BASE_SEPOLIA,
        ),
        PricedResource(
            path="/v1/market-snapshot",
            description="Full market depth snapshot",
            amount_atomic=50_000,  # 0.05 USDC
            handler=_market_snapshot,
            network=BASE_SEPOLIA,
        ),
        PricedResource(
            path="/v1/risk-report",
            description="Risk assessment with contributing factors",
            amount_atomic=250_000,  # 0.25 USDC
            handler=_risk_report,
            network=BASE_SEPOLIA,
        ),
    ]


__all__ = ["default_resources", "PricedResource", "Sequence"]