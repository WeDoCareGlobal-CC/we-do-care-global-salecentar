"""Real settlement through a hosted x402 facilitator.

The local :func:`hermes_x402.verification.settle` records a payment and returns a
deterministic synthetic hash. That is fine for tests but it moves no money: no
``transferWithAuthorization`` is ever broadcast.

This module replaces that with the real thing. The resource server does *not*
hold the funds or the gas; a facilitator does. Per the x402 specification the
seller's job is to verify the buyer's signature locally (free, and required so
you never pay a facilitator fee for a payment you would have rejected anyway)
and then hand the signed authorization to the facilitator's ``/settle``,
which broadcasts it on-chain and returns the real transaction hash.

Supported facilitators:

``cdp``
    Coinbase Developer Platform, ``https://api.cdp.coinbase.com/platform/v2/x402``.
    Authenticates with an Ed25519 JWT minted from a CDP API key id/secret. The
    first 1,000 on-chain transactions each month are free, then $0.001 each.
    Supports Base and Base Sepolia under the ``exact`` scheme.

Only ``POST /verify`` and ``POST /settle`` are implemented, which is all the
seller side of the protocol needs. Nothing here is required for local testing:
with no credentials configured the server keeps using the simulated settler.
"""

from __future__ import annotations

import base64
import json
import os
import time
from dataclasses import dataclass
from typing import Any

from .types import PaymentPayload, PaymentRequirements, SettlementResponse

DEFAULT_CDP_URL = "https://api.cdp.coinbase.com/platform/v2/x402"


class FacilitatorError(RuntimeError):
    """The facilitator could not be reached or refused the payment."""


@dataclass(frozen=True)
class FacilitatorConfig:
    """Credentials for a hosted facilitator.

    ``api_key_id``/``api_secret`` are CDP credentials and mint the JWT that
    authenticates every call. Never log or persist the secret.
    """

    kind: str  # "cdp"
    url: str
    api_key_id: str
    api_secret: str

    @classmethod
    def from_env(cls) -> FacilitatorConfig | None:
        """Build config from CDP_API_KEY_ID / CDP_SECRET_KEY, or None."""
        key_id = os.getenv("CDP_API_KEY_ID", "").strip()
        secret = os.getenv("CDP_SECRET_KEY", "").strip()
        if not key_id or not secret:
            return None
        url = os.getenv("X402_FACILITATOR_URL", DEFAULT_CDP_URL).strip() or DEFAULT_CDP_URL
        return cls(kind="cdp", url=url.rstrip("/"), api_key_id=key_id, api_secret=secret)


def _cdp_jwt(
    config: FacilitatorConfig,
    ttl_seconds: int = 120,
    method: str = "GET",
    host: str = "api.cdp.coinbase.com",
    path: str = "/",
) -> str:
    """Mint the short-lived JWT that authenticates CDP requests.

    ``uri`` must be ``"<METHOD> <host><path>"`` and must match the request the
    token is sent with; Coinbase rejects a token minted for a different
    endpoint.

    CDP expects an Ed25519 JWT in ``kid=<api_key_id>`` form with a 120s lifetime.
    Signing uses the vendored pure-Python Ed25519 (RFC 8032) rather than
    ``cryptography``: that library needs _cffi_backend, which is unavailable on
    aarch64 Termux under this app id, and pip cannot build it because Termux
    hardcodes the retired /data/data/com.termux prefix.

    ``api_secret`` is accepted as base64 of either a 32-byte raw seed (RFC 8032
    convention) or a DER PKCS#8 blob, since CDP documentation shows both.
    """
    import base64

    key = _load_ed25519_key(config.api_secret)
    uri = f"{method.upper()} {host}{path}"

    def segment(obj: dict[str, Any]) -> str:
        raw = json.dumps(obj, separators=(",", ":")).encode()
        return base64.urlsafe_b64encode(raw).decode().rstrip("=")

    now = int(time.time())
    # The `alg` must match the key type: ES256 for a P-256 key, EdDSA for
    # Ed25519. Getting this wrong yields a signature CDP rejects.
    alg = "ES256" if _is_p256(key) else "EdDSA"
    header = segment({"alg": alg, "kid": config.api_key_id, "typ": "JWT", "nonce": secrets_hex()})
    # `uri` and `nbf` are both required by CDP. Without them the API answers 401
    # even when the signature is perfectly valid: `uri` binds the token to this
    # exact method/host/path, and `nbf` states the not-before time.
    claims = segment(
        {
            "sub": config.api_key_id,
            "iss": "cdp",
            "aud": ["cdp_service"],
            "nbf": now,
            "iat": now,
            "exp": now + ttl_seconds,
            "uri": uri or "",
        }
    )
    signature = base64.urlsafe_b64encode(_sign(key, f"{header}.{claims}".encode())).decode().rstrip("=")
    return f"{header}.{claims}.{signature}"


def _is_p256(key: Any) -> bool:
    """True only for a P-256/ECDSA key.

    Checked by class rather than by curve name on purpose: the vendored Ed25519
    SigningKey exposes a ``curve`` attribute too, so a name-based test would
    misclassify it and emit ES256 for an Ed25519 key.
    """
    module = type(key).__module__ or ""
    return "ecdsa" in module or type(key).__name__ == "EllipticCurvePrivateKey"


def _sign(key: Any, message: bytes) -> bytes:
    """Sign with either key type, returning a JWS-shaped signature.

    ES256 requires fixed-width ``R || S`` with each half left-padded to 32
    bytes; the vendored Ed25519 implementation already returns the 64 raw bytes
    JWT expects for ``EdDSA``. Signatures are non-deterministic for ECDSA, which
    is correct and expected for this scheme.
    """
    if _is_p256(key):
        import hashlib

        import ecdsa.util

        der = key.sign(message, hashfunc=hashlib.sha256, sigencode=ecdsa.util.sigencode_der)
        r, s = ecdsa.util.sigdecode_der(der, ecdsa.util.sigencode_der)
        return r.to_bytes(32, "big") + s.to_bytes(32, "big")
    return key.sign(message)


def _load_ed25519_key(secret: str) -> "SigningKey | Any":
    """Build a signer from a base64 CDP API secret.

    CDP issues two key types and both must work:

    * **Ed25519** -- a 32-byte RFC 8032 seed, or a PKCS#8 DER blob.
    * **P-256 / ES256** -- a raw 64-byte blob of ``d || Q`` (the private scalar
      followed by the uncompressed public point without its 0x04 tag).

    Returns whichever object exposes ``sign()``: the vendored
    ``hermes_x402.ed25519.SigningKey`` for Ed25519, or a ``cryptography``
    ``EllipticCurvePrivateKey`` for ES256. Both produce DER signatures, and the
    JWT layer base64url-encodes them, so the header's ``alg`` must be chosen to
    match -- see :func:`_cdp_jwt`.
    """
    raw = base64.b64decode(secret)

    # Ed25519 in the "expanded" 64-byte form: seed || public key. This is what
    # CDP issues by default and what their own code samples describe. Verify by
    # deriving the public key from the seed and comparing, so a P-256 secret is
    # never silently misread as Ed25519 (both are 64 bytes).
    if len(raw) == 64:
        from .ed25519 import SigningKey

        candidate = SigningKey(raw[:32])
        if candidate.public_key == raw[32:]:
            return candidate
        return _p256_key(raw[:32])

    if len(raw) == 32:
        # RFC 8032 seed: use it directly.
        from .ed25519 import SigningKey

        return SigningKey(raw)

    seed = _ed25519_seed_from_der(raw)
    if seed is not None:
        from .ed25519 import SigningKey

        return SigningKey(seed)

    p256 = _p256_from_der(raw)
    if p256 is not None:
        return p256

    raise FacilitatorError(
        "CDP secret is neither a 32-byte Ed25519 seed, a 64-byte P-256 pair, nor a DER key"
    )


def _p256_key(scalar: bytes):
    """Build an ``ecdsa`` P-256 signing key from a raw 32-byte scalar.

    Uses the pure-Python ``ecdsa`` package rather than ``cryptography``:
    cryptography's ``hazmat.primitives.asymmetric.ec`` segfaults (SIGSEGV,
    exit 139) on this aarch64 Termux build because its bundled Rust extension
    is not built for this ABI. ``ecdsa`` is pure Python and already a project
    dependency for secp256k1 work.
    """
    try:
        import ecdsa
    except ImportError as exc:  # pragma: no cover - environment guard
        raise FacilitatorError(
            "CDP key is P-256/ES256 but the pure-Python 'ecdsa' package is not installed"
        ) from exc
    return ecdsa.SigningKey.from_string(scalar, curve=ecdsa.NIST256p)


def _p256_from_der(der: bytes):
    """Load a P-256 key from DER, or return None if it is not one."""
    try:
        import ecdsa
    except ImportError:
        return None
    try:
        key = ecdsa.SigningKey.from_der(der)
    except Exception:
        return None
    return key if key.curve.name == "NIST256p" else None


def _ed25519_seed_from_der(der: bytes) -> bytes | None:
    """Pull the 32-byte Ed25519 seed out of a PKCS#8 DER encoding.

    The seed is the OCTET STRING inside the CurvePrivateKey structure, which is
    the final 32 bytes of the encoding, so a length check plus a tail slice is
    enough and avoids an ASN.1 dependency. Returns None for other key types.
    """
    # PKCS#8 for Ed25519 always ends with: 04 20 <32 bytes>
    if len(der) < 32:
        return None
    if der[-34:-32] == b"\x04\x20":
        return der[-32:]
    # RFC 8410 puts the seed directly after a fixed 16-byte prefix.
    if der[:2] == b"\x30\x2e" and len(der) == 48:
        return der[16:]
    return None


def secrets_hex(nbytes: int = 16) -> str:
    import secrets

    return secrets.token_hex(nbytes)


class FacilitatorClient:
    """Minimal HTTP client for a facilitator's verify and settle endpoints."""

    def __init__(self, config: FacilitatorConfig, timeout: float = 30.0) -> None:
        self.config = config
        self.timeout = timeout

    def _headers(self, method: str = "POST", path: str = "/") -> dict[str, str]:
        # The JWT's `uri` claim must be "<METHOD> <host><full path>" and must
        # match the request exactly. `path` is relative to config.url, so the
        # base path has to be prepended -- a token naming just "/verify" when
        # the real endpoint is "/platform/v2/x402/verify" is rejected with 401.
        # Minted per request: a token for /verify is not accepted by /settle.
        from urllib.parse import urlparse

        parsed = urlparse(self.config.url)
        full_path = parsed.path.rstrip("/") + path
        return {
            "Authorization": f"Bearer {_cdp_jwt(self.config, method=method, host=parsed.netloc, path=full_path)}",
            "Content-Type": "application/json",
        }

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        import httpx

        url = f"{self.config.url}{path}"
        try:
            response = httpx.post(url, json=payload, headers=self._headers("POST", path), timeout=self.timeout)
        except Exception as exc:  # network, DNS, TLS
            raise FacilitatorError(f"facilitator unreachable: {exc}") from exc

        if response.status_code >= 400:
            # Surface the facilitator's own reason; it is the most useful
            # diagnostic when a payment fails on-chain.
            raise FacilitatorError(
                f"facilitator {path} returned {response.status_code}: {response.text[:300]}"
            )
        try:
            return response.json()
        except ValueError as exc:
            raise FacilitatorError(f"facilitator {path} returned non-JSON") from exc

    def verify(self, payload: PaymentPayload, requirements: PaymentRequirements) -> dict[str, Any]:
        return self._post("/verify", _envelope(payload, requirements))

    def settle(self, payload: PaymentPayload, requirements: PaymentRequirements) -> SettlementResponse:
        """Broadcast the payment on-chain and return the real transaction hash.

        Raises :class:`FacilitatorError` if the facilitator refuses. The caller
        is responsible for recording the rejection; this method does not touch
        the ledger.
        """
        body = self._post("/settle", _envelope(payload, requirements))

        transaction = body.get("transaction") or body.get("txHash") or body.get("transactionHash") or ""
        payer = body.get("payer", payload.payload.get("authorization", {}).get("from", ""))
        if not transaction:
            # The facilitator reported success but gave us nothing to record;
            # treating that as success would book revenue that never settled.
            raise FacilitatorError(f"facilitator returned no transaction hash: {str(body)[:200]}")

        return SettlementResponse(
            success=True,
            transaction=transaction,
            network=payload.network,
            payer=payer,
            error_reason=None,
        )


def _facilitator_network(network: str) -> str:
    """Translate a CAIP-2 chain id to the short name the facilitator expects.

    The x402 spec (and therefore our own 402 headers) uses CAIP-2, e.g.
    ``eip155:84532``, but Coinbase's facilitator only accepts the short slug
    ``base-sepolia``. Sending the CAIP-2 form fails schema validation with a
    confusing "must match one of [x402V2PaymentPayload, x402V1PaymentPayload]"
    error, because the validator cannot match either shape.
    """
    from .networks import resolve_network

    if network and not network.startswith("eip155:"):
        return network
    config = resolve_network(network) if network else None
    return config.name if config else network


def _envelope(payload: PaymentPayload, requirements: PaymentRequirements) -> dict[str, Any]:
    """Build the {x402Version, paymentPayload, paymentRequirements} body.

    The facilitator only needs the scheme, network, price and payTo to know
    where the money must go; asset and the remaining fields ride along so the
    facilitator can run its own scheme checks.
    """
    payment_payload: dict[str, Any] = {
        "x402Version": payload.x402_version,
        "scheme": payload.scheme,
        "network": _facilitator_network(payload.network),
        "payload": payload.payload,
    }
    return {
        "x402Version": payload.x402_version,
        "paymentPayload": payment_payload,
        "paymentRequirements": {
            "scheme": requirements.scheme,
            "network": _facilitator_network(requirements.network),
            "maxAmountRequired": str(requirements.amount),
            "resource": requirements.resource,
            "description": requirements.description,
            "mimeType": requirements.mime_type,
            "payTo": requirements.pay_to,
            "maxTimeoutSeconds": requirements.max_timeout_seconds,
            "asset": requirements.asset,
            "extra": {"name": requirements.extra.get("name", "USDC"), "version": requirements.extra.get("version", "2")}
            if requirements.extra
            else {"name": "USDC", "version": "2"},
        },
    }