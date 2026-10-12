"""Package entry point: ``python -m hermes_x402``.

This indirection is deliberate. Launching the server with
``python -m hermes_x402.server`` executes server.py a second time under the
module name ``__main__``, so the module object holding the live server instance
is *not* the one the request handlers import as ``hermes_x402.server``. Handlers
then see an empty module global and any endpoint that reads server state
(the worker manifest, the revenue report) returns empty data.

Going through the package keeps exactly one copy of the module: ``__main__.py``
imports ``hermes_x402.server`` by its real name, so the builders and the handlers
share one module object.
"""

from .server import main

raise SystemExit(main())