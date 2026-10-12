"""Call a live CDP endpoint to prove the minted JWT is actually accepted.

A locally-minted JWT only proves the signing code runs. This asks Coinbase who
holds the authority: a 200 means the credential, signature and algorithm are all
correct. Never prints the secret or the token.
"""

import json
import os
import urllib.error
import urllib.request

from hermes_x402.onchain import FacilitatorConfig, _cdp_jwt

HOST = "api.cdp.coinbase.com"
# Read-only, non-mutating endpoint: list addresses for the project.
PATH = "/platform/v2/evm/addresses"


def main() -> int:
    config = FacilitatorConfig.from_env()
    if config is None:
        print("no CDP credentials in environment")
        return 2

    token = _cdp_jwt(config, method="GET", host=HOST, path=PATH)
    request = urllib.request.Request(
        f"https://{HOST}{PATH}",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode()
            print(f"HTTP {response.status}  <- JWT ACCEPTED by Coinbase")
            try:
                data = json.loads(body)
                print("payload keys:", list(data)[:6])
            except ValueError:
                print("body:", body[:200])
            return 0
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()[:300]
        print(f"HTTP {exc.code}  <- REJECTED")
        print("detail:", detail)
        return 1
    except Exception as exc:
        print(f"{type(exc).__name__}: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())