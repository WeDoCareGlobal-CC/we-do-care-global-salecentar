"""Ed25519 signatures in pure Python (RFC 8032).

Why this exists rather than ``cryptography``:

On aarch64 Termux under the ``com.hermesagent.android`` app id, every C-backed
path fails. ``cryptography`` imports ``_cffi_backend``, which is not in the
Termux repository; ``pip install cffi`` fails because its build subprocess
hardcodes the retired ``/data/data/com.termux/files/usr/bin/python3.14`` path;
and dpkg maintainer scripts fail for the same reason. This module is the same
answer the project already uses for Keccak-256: implement it directly, so the
x402 rail depends on nothing but the standard library.

Used to sign the Ed25519 JWT that authenticates requests to a facilitator
(CDP). Ed25519 needs SHA-512, which :mod:`hashlib` provides natively.

Validation: ``tests/test_ed25519.py`` checks against the RFC 8032 test vectors.
"""

from __future__ import annotations

import hashlib
import secrets

__all__ = ["SigningKey", "generate_seed", "sign", "verify"]

# Curve25519 / edwards25519 parameters.
P = 2**255 - 19
L = 2**252 + 27742317777372353535851937790883648493  # group order
D = -121665 * pow(121666, P - 2, P) % P
# Base point B, defined after _recover_x below. Its x coordinate is even
# (x & 1 == 0), so the sign passed to _recover_x must be 0 -- passing 1 yields
# the negation, which produces keys and signatures differing from RFC 8032 in
# the final byte.
_BY = 4 * pow(5, P - 2, P) % P


def _inv(x: int) -> int:
    return pow(x, P - 2, P)


def _recover_x(y: int, sign: int) -> int | None:
    """Recover the x coordinate for a given y on edwards25519."""
    if y >= P:
        return None
    xx = (y * y - 1) * _inv(D * y * y + 1) % P
    if xx == 0:
        return None if sign else 0
    x = pow(xx, (P + 3) // 8, P)
    if (x * x - xx) % P != 0:
        x = x * pow(2, (P - 1) // 4, P) % P
    if (x * x - xx) % P != 0:
        return None
    if x % 2 != sign:
        x = P - x
    return x


# Extended homogeneous coordinates (X, Y, Z, T) for cheap addition.
_BX = _recover_x(_BY, 0)
assert _BX is not None
B = (_BX, _BY, 1, _BX * _BY % P)


def _add(p: tuple[int, int, int, int], q: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    x1, y1, z1, t1 = p
    x2, y2, z2, t2 = q
    a = (y1 - x1) * (y2 - x2) % P
    b = (y1 + x1) * (y2 + x2) % P
    c = 2 * t1 * t2 * D % P
    dd = 2 * z1 * z2 % P
    e = b - a
    f = dd - c
    g = dd + c
    h = b + a
    return (e * f % P, g * h % P, f * g % P, e * h % P)


def _mul(scalar: int, point: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    result = (0, 1, 1, 0)  # neutral element
    while scalar > 0:
        if scalar & 1:
            result = _add(result, point)
        point = _add(point, point)
        scalar >>= 1
    return result


def _compress(point: tuple[int, int, int, int]) -> bytes:
    x, y, z, _ = point
    zinv = _inv(z)
    x = x * zinv % P
    y = y * zinv % P
    return int.to_bytes(y | ((x & 1) << 255), 32, "little")


def _decompress(data: bytes) -> tuple[int, int, int, int] | None:
    if len(data) != 32:
        return None
    value = int.from_bytes(data, "little")
    sign = value >> 255
    y = value & ((1 << 255) - 1)
    x = _recover_x(y, sign)
    if x is None:
        return None
    return (x, y, 1, x * y % P)


def _equal(p: tuple[int, int, int, int], q: tuple[int, int, int, int]) -> bool:
    x1, y1, z1, _ = p
    x2, y2, z2, _ = q
    return (x1 * z2 - x2 * z1) % P == 0 and (y1 * z2 - y2 * z1) % P == 0


def _secret_expand(seed: bytes) -> tuple[int, bytes]:
    if len(seed) != 32:
        raise ValueError("Ed25519 seed must be 32 bytes")
    digest = hashlib.sha512(seed).digest()
    a = int.from_bytes(digest[:32], "little")
    a &= (1 << 254) - 8  # clear low 3 bits
    a |= 1 << 254  # set bit 254
    return a, digest[32:]


def generate_seed() -> bytes:
    """A cryptographically random 32-byte Ed25519 seed."""
    return secrets.token_bytes(32)


def public_key(seed: bytes) -> bytes:
    """The 32-byte public key for a 32-byte seed."""
    a, _ = _secret_expand(seed)
    return _compress(_mul(a, B))


def sign(seed: bytes, message: bytes) -> bytes:
    """Return the 64-byte Ed25519 signature over ``message``."""
    a, prefix = _secret_expand(seed)
    encoded_a = _compress(_mul(a, B))
    r = int.from_bytes(hashlib.sha512(prefix + message).digest(), "little") % L
    encoded_r = _compress(_mul(r, B))
    k = int.from_bytes(hashlib.sha512(encoded_r + encoded_a + message).digest(), "little") % L
    s = (r + k * a) % L
    return encoded_r + int.to_bytes(s, 32, "little")


def verify(public: bytes, message: bytes, signature: bytes) -> bool:
    """Check a 64-byte signature against a 32-byte public key."""
    if len(signature) != 64 or len(public) != 32:
        return False
    encoded_r = signature[:32]
    s = int.from_bytes(signature[32:], "little")
    if s >= L:  # reject malleable / non-canonical scalars
        return False
    point_a = _decompress(public)
    point_r = _decompress(encoded_r)
    if point_a is None or point_r is None:
        return False
    k = int.from_bytes(hashlib.sha512(encoded_r + public + message).digest(), "little") % L
    # [s]B == R + [k]A
    return _equal(_mul(s, B), _add(point_r, _mul(k, point_a)))


class SigningKey:
    """Convenience wrapper mirroring the subset of Ed25519 keys that is needed."""

    __slots__ = ("_seed", "_public")

    def __init__(self, seed: bytes) -> None:
        if len(seed) != 32:
            raise ValueError("Ed25519 seed must be 32 bytes")
        self._seed = seed
        self._public = public_key(seed)

    @classmethod
    def generate(cls) -> "SigningKey":
        return cls(generate_seed())

    @property
    def public_key(self) -> bytes:
        return self._public

    def sign(self, message: bytes) -> bytes:
        return sign(self._seed, message)

    def verify(self, message: bytes, signature: bytes) -> bool:
        return verify(self._public, message, signature)