"""WSGI entrypoint for Azure App Service (Linux).

App Service's Python stack looks for `application.py` or `app.py` at the root
of the deployed package and starts it with gunicorn. It injects the `PORT`
environment variable; binding 0.0.0.0 is mandatory or the site never answers.

Azure also sets WEBSITE_SITE_NAME / SCM_DO_BUILD_DURING_DEPLOYMENT. The wallet
key comes from the X402_PRIVATE_KEY app setting: the dev key is published in
this repository, so this module refuses to expose it publicly.
"""

from __future__ import annotations

import os
import sys

from hermes_x402.demo_resources import default_resources
from hermes_x402.ledger import Ledger
from hermes_x402.networks import resolve_network
from hermes_x402.server import DEV_PRIVATE_KEY, X402Server

app = None


def build() -> object:
    global app
    if app is not None:
        return app

    network_name = os.getenv("X402_NETWORK", "base-sepolia")
    network = resolve_network(network_name)
    if network is None:
        raise RuntimeError(f"unknown network {network_name!r}")

    private_key = os.getenv("X402_PRIVATE_KEY", "").strip()
    host = os.getenv("X402_HOST", "0.0.0.0")
    is_public = host not in ("127.0.0.1", "localhost", "::1")

    if not private_key:
        if not is_public:
            private_key = DEV_PRIVATE_KEY  # local development only
        else:
            raise RuntimeError(
                "X402_PRIVATE_KEY is not set. The built-in dev key is public in "
                "this repository and must never receive real payments. Add it "
                "as an App Service application setting."
            )
    elif private_key == DEV_PRIVATE_KEY and is_public:
        raise RuntimeError(
            "X402_PRIVATE_KEY is set to the published dev key; refusing to "
            "serve publicly with it."
        )

    if os.getenv("X402_SETTLE_MODE", "simulate") != "simulate":
        raise RuntimeError("Use python -m hermes_x402 for facilitator mode; this entrypoint is simulation-only")
    if is_public and os.getenv("X402_ALLOW_PUBLIC_SIMULATION") != "true":
        raise RuntimeError("Public simulation disabled; use X402_ALLOW_PUBLIC_SIMULATION=true only in isolated testing")
    ledger = Ledger(os.getenv("X402_LEDGER_DB", "/home/x402_profit.db"))
    server = X402Server(
        default_resources(),
        ledger=ledger,
        network=network,
        private_key=private_key,
    )
    print(f"wallet {server.pay_to} on {network.name}", flush=True)
    app = server.app
    return app


# gunicorn imports this module and starts the callable named `application`.
# App Service's default startup command is
#   gunicorn --bind=0.0.0.0 --timeout 600 application:app
# so `app` must also exist as an alias. It is the raw ASGI app, which is why the
# gunicorn invocation must use UvicornWorker rather than the sync default.
app = build()
application = app


if __name__ == "__main__":  # local smoke test
    import uvicorn

    uvicorn.run(build(), host="127.0.0.1", port=int(os.getenv("PORT", "8000")))