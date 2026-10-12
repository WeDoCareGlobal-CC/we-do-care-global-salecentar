"""Verify CDP JWT minting for both key types, without printing secrets.

Run with CDP_API_KEY_ID / CDP_SECRET_KEY exported from the key file.
"""

import base64
import json

from hermes_x402.onchain import (
    FacilitatorConfig,
    _cdp_jwt,
    _is_p256,
    _load_ed25519_key,
    _sign,
)


def check(label, secret, expect_p256):
    try:
        key = _load_ed25519_key(secret)
        jwt = _cdp_jwt(
            type(
                "C",
                (),
                {
                    "api_key_id": "fe6a2b54-2280-4b5c-9d07-1db5c7a185ac",
                    "api_secret": secret,
                },
            )()
        )
        header_b64, _, sig_b64 = jwt.split(".")
        pad = lambda x: x + "=" * (-len(x) % 4)
        header = json.loads(base64.urlsafe_b64decode(pad(header_b64)))
        sig = base64.urlsafe_b64decode(pad(sig_b64))
        print(f"{label}: OK")
        print(f"  key type  : {type(key).__name__}")
        print(f"  p256?     : {_is_p256(key)} (expected {expect_p256})")
        print(f"  alg       : {header['alg']}")
        print(f"  sig bytes : {len(sig)}")
        print(f"  kid match : {header['kid'] == 'fe6a2b54-2280-4b5c-9d07-1db5c7a185ac'}")
    except Exception as exc:
        print(f"{label}: FAILED -> {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    import os

    real = os.environ["CDP_SECRET_KEY"]
    # A known Ed25519 test seed (RFC 8032 vector 1) to prove no regression.
    ed_seed = "1" * 64  # placeholder replaced below
    ed25519_b64 = (
        "nWGxne/9WmC6hEr0kuwsxERJxWl7MmkZcDusAxyuf2A="
    )

    check("real CDP key", real, expect_p256=True)
    check("ed25519 regression", ed25519_b64, expect_p256=False)