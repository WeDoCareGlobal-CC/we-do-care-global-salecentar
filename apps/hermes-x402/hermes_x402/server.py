"""FastAPI resource server that sells access with x402.

The 402 challenge is built from the same ``PricedResource`` that settlement
later enforces, so the terms a client sees can never drift from what is
actually charged.

Run locally:

    python -m hermes_x402.server --port 8402

The default wallet key is a throwaway dev key. Never reuse it on mainnet.
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from dataclasses import dataclass
from typing import Any, Callable, Sequence

from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse

from .dashboard import register_dashboard
from .ledger import Ledger, atomic_to_usdc
from .networks import BASE_SEPOLIA, NETWORKS, NetworkConfig, resolve_network
from .types import (
    PAYMENT_HEADER,
    PAYMENT_RESPONSE_HEADER,
    PaymentPayload,
    PaymentRequiredResponse,
    PaymentRequirements,
    SettlementResponse,
    X402Error,
)
from .verification import settle, supported_kinds, verify

# Deterministic dev key so local runs and fixtures are reproducible.
DEV_PRIVATE_KEY = "0x" + "11" * 32


@dataclass(frozen=True)
class PricedResource:
    """A route plus its payment terms."""

    path: str
    description: str
    amount_atomic: int
    handler: Callable[[Request], Any]
    network: NetworkConfig = BASE_SEPOLIA
    mime_type: str = "application/json"


class X402Server:
    """Wires priced routes, verification and the profit ledger together."""

    def __init__(
        self,
        resources: Sequence[PricedResource] = (),
        *,
        ledger: Ledger | None = None,
        pay_to: str | None = None,
        network: NetworkConfig = BASE_SEPOLIA,
        private_key: str = DEV_PRIVATE_KEY,
        facilitator: Any | None = None,
    ) -> None:
        from .eip712 import address_from_private_key

        self.ledger = ledger or Ledger()
        self.network = network
        self.pay_to = pay_to or address_from_private_key(private_key)
        self.resources = list(resources)
        # When set, payments settle on-chain through a facilitator. Without it
        # the server falls back to the local simulated settler, which moves no
        # money and must never be used to take real payments.
        self.facilitator = facilitator
        self.app = FastAPI(title="hermes-x402-profit", version="1.0.0")
        # Financial/admin routes are private. Never expose them without a configured key.
        from fastapi.responses import JSONResponse as _JSONResponse
        import hmac as _hmac
        import os as _os

        @self.app.middleware("http")
        async def protect_financial_routes(request: Request, call_next):
            path = request.url.path
            if path in ("/profit/summary", "/profit/settlements", "/dashboard", "/"):
                expected = _os.getenv("HERMES_ADMIN_API_KEY", "")
                supplied = request.headers.get("x-hermes-admin-key", "")
                if not expected or not _hmac.compare_digest(supplied, expected):
                    return _JSONResponse(status_code=403, content={"detail": "financial access denied"})
            return await call_next(request)

        self._install_core_routes()
        for resource in self.resources:
            self._install_paid_route(resource)

    # -- settlement ----------------------------------------------------

    def _settle_checked(
        self,
        payload: PaymentPayload,
        requirements: PaymentRequirements,
        ledger: Ledger,
    ) -> SettlementResponse:
        """Settle via the facilitator when configured, else simulate.

        Both paths record to the same ledger so revenue reporting is uniform;
        only the ``detail.simulated`` flag and the real transaction hash differ.
        A facilitator failure is a failed settlement, never a silent fallback to
        simulation: booking revenue that never moved on-chain is the one failure
        mode that must not happen.
        """
        from .onchain import FacilitatorError

        if self.facilitator is None:
            return settle(payload, requirements, ledger)

        try:
            receipt = self.facilitator.settle(payload, requirements)
        except FacilitatorError as exc:
            # record_rejection has no detail column; the facilitator's own
            # message goes to the server log rather than the ledger.
            print(f"facilitator settlement failed: {exc}", file=sys.stderr)
            ledger.record_rejection(
                "facilitator_error",
                network=payload.network,
                payer="",
                resource=requirements.resource,
            )
            return SettlementResponse(
                success=False,
                transaction="",
                network=payload.network,
                payer="",
                error_reason="facilitator_error",
            )

        network = self.network
        authorization = payload.payload.get("authorization", {})
        ledger.record_settlement(
            network=payload.network,
            asset=requirements.asset,
            payer=receipt.payer or authorization.get("from", ""),
            pay_to=requirements.pay_to,
            amount_atomic=int(authorization.get("value", requirements.amount)),
            nonce=authorization.get("nonce", ""),
            tx_hash=receipt.transaction,
            resource=requirements.resource,
            status="settled",
            detail={"simulated": False, "scheme": payload.scheme, "settled_at": time.time()},
            decimals=network.usdc_decimals,
        )
        return receipt

    # -- payment terms -------------------------------------------------

    def requirements_for(self, resource: PricedResource) -> PaymentRequirements:
        return PaymentRequirements(
            scheme="exact",
            network=resource.network.name,
            max_amount_required=str(resource.amount_atomic),
            asset=resource.network.usdc_asset,
            pay_to=self.pay_to,
            resource=resource.path,
            description=resource.description,
            mime_type=resource.mime_type,
            max_timeout_seconds=60,
            extra={
                "name": resource.network.usdc_name,
                "version": resource.network.usdc_version,
            },
        )

    # -- routes --------------------------------------------------------

    def _install_core_routes(self) -> None:
        app = self.app

        @app.get("/health")
        def health() -> dict[str, Any]:
            return {"status": "ok", "wallet": self.pay_to, "network": self.network.name}

        @app.get("/supported")
        def supported() -> dict[str, Any]:
            """Facilitator GET /supported equivalent."""
            return supported_kinds(list(NETWORKS.values()))

        @app.get("/discovery/resources")
        def discovery() -> dict[str, Any]:
            """Bazaar-style discovery so buyers can see prices up front."""
            items = [
                {
                    "resource": resource.path,
                    "type": "http",
                    "x402Version": 1,
                    "accepts": [self.requirements_for(resource).to_wire()],
                    "lastUpdated": int(time.time()),
                    "metadata": {
                        "provider": "hermes-x402-profit",
                        "price_usdc": float(
                            atomic_to_usdc(resource.amount_atomic, resource.network.usdc_decimals)
                        ),
                    },
                }
                for resource in self.resources
            ]
            return {
                "x402Version": 1,
                "items": items,
                "pagination": {"limit": len(items), "offset": 0, "total": len(items)},
            }

        @app.get("/profit/summary")
        def profit_summary() -> dict[str, Any]:
            """Aggregated revenue for the dashboard."""
            summary = self.ledger.summary()
            return {
                "gross_usdc": str(summary.gross_usdc),
                "settlement_modes": self.ledger.settlement_mode_totals(),
                "confirmed_usdc": self.ledger.settlement_mode_totals()["confirmed"]["usdc"],
                "successful_settlements": summary.successful,
                "failed_settlements": summary.failed,
                "rejected_payments": summary.rejected,
                "unique_payers": self.ledger.unique_payers(),
                "average_usdc": str(summary.average_usdc),
                "by_resource": self.ledger.revenue_by_resource(),
                "top_payers": self.ledger.top_payers(limit=5),
                "rejections": self.ledger.rejection_breakdown(),
            }

        @app.get("/profit/settlements")
        def profit_settlements(limit: int = 20) -> dict[str, Any]:
            return {"settlements": self.ledger.recent_settlements(limit=max(1, min(limit, 100)))}

        register_dashboard(app, self.ledger)

    def _install_paid_route(self, resource: PricedResource) -> None:
        """Register a route that answers 402 until a valid payment arrives."""
        requirements = self.requirements_for(resource)
        ledger = self.ledger
        self.ledger.register_service(resource.path, resource.description, resource.amount_atomic)

        @self.app.get(resource.path, include_in_schema=False)
        def paid_route(
            request: Request,
            x_payment: str | None = Header(default=None, alias=PAYMENT_HEADER),
        ) -> JSONResponse:
            # No payment header: return the terms per the HTTP transport spec.
            if not x_payment:
                return _challenge(402, f"payment required for {resource.path}", requirements)

            try:
                payload = PaymentPayload.from_header(x_payment)
            except X402Error as exc:
                ledger.record_rejection(exc.code, resource=resource.path)
                # Malformed payment is a client error, not a payment demand.
                return _challenge(400, exc.message, requirements)

            # Verify before doing any work so unpaid requests cost nothing.
            check = verify(payload, requirements, ledger)
            if not check.is_valid:
                reason = check.invalid_reason or "unexpected_verify_error"
                ledger.record_rejection(
                    reason, network=payload.network, payer=check.payer, resource=resource.path
                )
                return _challenge(
                    402,
                    reason,
                    requirements,
                    settlement=SettlementResponse(
                        success=False,
                        transaction="",
                        network=payload.network,
                        payer=check.payer,
                        error_reason=reason,
                    ),
                )

            receipt = self._settle_checked(payload, requirements, ledger)
            if not receipt.success:
                return _challenge(
                    402,
                    receipt.error_reason or "settlement failed",
                    requirements,
                    settlement=receipt,
                )

            return JSONResponse(
                status_code=200,
                content=resource.handler(request),
                headers={PAYMENT_RESPONSE_HEADER: receipt.to_header()},
            )


def _challenge(
    status: int,
    error: str,
    requirements: PaymentRequirements,
    settlement: SettlementResponse | None = None,
) -> JSONResponse:
    headers = {PAYMENT_RESPONSE_HEADER: settlement.to_header()} if settlement else None
    return JSONResponse(
        status_code=status,
        content=PaymentRequiredResponse(error=error, accepts=[requirements]).to_wire(),
        headers=headers,
    )


def build_app(resources: Sequence[PricedResource], **kwargs: Any) -> FastAPI:
    return X402Server(resources, **kwargs).app


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the hermes-x402-profit resource server")
    parser.add_argument("--host", default=os.getenv("X402_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.getenv("X402_PORT", "8402")))
    parser.add_argument("--network", default=os.getenv("X402_NETWORK", BASE_SEPOLIA.name))
    parser.add_argument("--pay-to", default=os.getenv("X402_PAY_TO"))
    parser.add_argument(
        "--private-key",
        default=os.getenv("X402_PRIVATE_KEY", DEV_PRIVATE_KEY),
        help="wallet key; falls back to the public dev key",
    )
    parser.add_argument("--db", default=os.getenv("X402_LEDGER_DB", "x402_profit.db"))
    parser.add_argument(
        "--workers",
        choices=("demo", "profit", "both"),
        default=os.getenv("X402_WORKERS", "both"),
        help="demo: fixture endpoints; profit: workers that compute real results; both",
    )
    parser.add_argument(
        "--settle-mode",
        choices=("facilitator", "simulate"),
        default=os.getenv("X402_SETTLE_MODE", "facilitator" if os.getenv("CDP_API_KEY_ID") else "simulate"),
        help="facilitator settles on-chain for real money; simulate records locally and moves nothing",
    )
    args = parser.parse_args()

    import uvicorn

    network = resolve_network(args.network)
    if network is None:
        raise SystemExit(f"unknown network {args.network!r}")

    def catalogue():
        """Pick the paid worker set for this deployment."""
        from .demo_resources import default_resources
        from .profit_workers import profit_workers

        if args.workers == "profit":
            return profit_workers(network)
        if args.workers == "both":
            return profit_workers(network) + default_resources()
        return default_resources()

    facilitator = None
    if args.settle_mode == "facilitator":
        from .onchain import FacilitatorClient, FacilitatorConfig

        config = FacilitatorConfig.from_env()
        if config is None:
            raise SystemExit(
                "settle-mode facilitator needs CDP_API_KEY_ID and CDP_SECRET_KEY; "
                "generate them at https://portal.cdp.coinbase.com/products/api-keys"
            )
        facilitator = FacilitatorClient(config)
    else:
        print(
            "WARNING: settle-mode=simulate records revenue in the ledger but "
            "broadcasts no transaction; no money moves",
            file=sys.stderr,
        )

    if args.host not in ("127.0.0.1", "localhost", "::1") and args.settle_mode == "simulate" and os.getenv("X402_ALLOW_PUBLIC_SIMULATION") != "true":
        print("refusing public simulated settlement; set X402_ALLOW_PUBLIC_SIMULATION=true only for isolated testing", file=sys.stderr)
        return 1

    # A publicly deployed instance must never settle into the dev key, which is
    # published in this repo and therefore known to everyone.
    using_dev_key = args.private_key == DEV_PRIVATE_KEY
    if args.host not in ("127.0.0.1", "localhost", "::1"):
        if using_dev_key:
            print(
                "refusing to bind publicly with the public dev key; "
                "set X402_PRIVATE_KEY",
                file=sys.stderr,
            )
            return 1
        print("WARNING: dev key is public, never use it for real payments")

    server = X402Server(
        catalogue(),
        ledger=Ledger(args.db),
        network=network,
        private_key=args.private_key,
        facilitator=facilitator,
        **({"pay_to": args.pay_to} if args.pay_to else {}),
    )
    # Let handlers reach the live ledger/resources for data-backed endpoints.
    set_active_server(server)
    print(f"x402 server on http://{args.host}:{args.port}")
    print(f"  wallet  {server.pay_to}")
    print(f"  network {network.name} ({network.caip2})")
    print(f"  ledger  {args.db}")
    mode = "facilitator (real settlement)" if facilitator else "simulate (no money moves)"
    print(f"  settle  {mode}")
    uvicorn.run(server.app, host=args.host, port=args.port, log_level="warning")
    return 0


# -- accessors for paid workers ---------------------------------------
#
# A handler is a plain callable, so it cannot close over the server instance.
# These hooks let a worker reach the live ledger, resources and facilitator.
#
# Deliberately module-level state rather than a closure: uvicorn may serve the
# app in a different process than the one that built it, and a closure captured
# at build time would not be visible to the handler there. The instance is
# attached to `app.state`, which uvicorn carries with the ASGI app, and cached
# here so the common in-process case stays cheap.

_ACTIVE_SERVER: X402Server | None = None


def set_active_server(server: X402Server) -> None:
    global _ACTIVE_SERVER
    _ACTIVE_SERVER = server
    server.app.state.x402_server = server


def _active_server() -> X402Server | None:
    return _ACTIVE_SERVER


def _active_ledger() -> Ledger | None:
    server = _active_server()
    return server.ledger if server else None


def _active_resources() -> list[PricedResource]:
    server = _active_server()
    return list(server.resources) if server else []


def _active_facilitator() -> Any:
    server = _active_server()
    return server.facilitator if server else None


if __name__ == "__main__":
    raise SystemExit(main())
