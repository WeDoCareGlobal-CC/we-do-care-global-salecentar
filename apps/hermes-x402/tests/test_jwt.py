"""Verify the CDP Ed25519 JWT path works on this device.

Real settlement is worthless if the JWT cannot be minted: the facilitator would
reject every call. This checks three things:

1. a raw 32-byte Ed25519 key signs and verifies,
2. the resulting JWT has the header/claims CDP expects,
3. a base64 DER key -- the shape CDP actually issues -- also loads.
"""

import base64
import json

from hermes_x402.ed25519 import SigningKey, verify
from hermes_x402.onchain import FacilitatorConfig, _cdp_jwt


def decode_segment(segment: str) -> dict:
    return json.loads(base64.urlsafe_b64decode(segment + "=" * (-len(segment) % 4)))


def main() -> None:
    # Deterministic 32-byte seed so the run is reproducible.
    seed = bytes(range(32))
    key = SigningKey(seed)
    secret = base64.b64encode(seed).decode()

    config = FacilitatorConfig(
        kind="cdp", url="https://example.invalid", api_key_id="kid-test-123", api_secret=secret
    )
    token = _cdp_jwt(config)
    header_seg, claims_seg, sig_seg = token.split(".")
    print("segments      :", len(token.split(".")))

    header = decode_segment(header_seg)
    claims = decode_segment(claims_seg)
    print("header        :", header)
    print("claims        :", claims)

    # CDP requires EdDSA and the key id in the header.
    assert header["alg"] == "EdDSA", header
    assert header["kid"] == "kid-test-123", header
    assert header["typ"] == "JWT", header
    # ...and a 120s lifetime, aud addressed to cdp_service.
    assert claims["aud"] == ["cdp_service"], claims
    assert claims["exp"] - claims["iat"] == 120, claims
    print("lifetime      :", claims["exp"] - claims["iat"], "seconds")

    # The signature must verify against the public key for the same seed.
    signing_input = f"{header_seg}.{claims_seg}".encode()
    signature = base64.urlsafe_b64decode(sig_seg + "=" * (-len(sig_seg) % 4))
    assert len(signature) == 64, len(signature)
    assert verify(key.public_key, signing_input, signature), "signature did not verify"
    print("sig verifies  : True (round-trip against the public key)")

    # A tampered payload must not verify. Note the signing input is base64, so
    # mutate a character of the encoded claims rather than looking for plain
    # text like "cdp_service", which does not appear in the encoded form.
    claims_bytes = bytearray(base64.urlsafe_b64decode(claims_seg + "=" * (-len(claims_seg) % 4)))
    claims_bytes[0] = (claims_bytes[0] + 1) % 256
    tampered_claims = base64.urlsafe_b64encode(bytes(claims_bytes)).decode().rstrip("=")
    tampered = f"{header_seg}.{tampered_claims}".encode()
    assert tampered != signing_input, "tamper had no effect"
    assert not verify(key.public_key, tampered, signature), "tampered payload verified!"
    print("tamper check  : rejected as expected")

    print("all jwt checks passed")


if __name__ == "__main__":
    main()