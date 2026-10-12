"""EIP-712 typed-data hashing, signing and signature recovery.

Signing uses RFC 6979 deterministic nonces over SHA-256, which is what
Ethereum tooling (eth_sign / ethers / viem) produces for a secp256k1 key, so a
signature produced here is byte-identical to one produced by a browser wallet
for the same key and payload.

secp256k1 point arithmetic comes from the pure-Python ``ecdsa`` package.
"""

from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass
from typing import Any

from ecdsa import SECP256k1, SigningKey, VerifyingKey
from ecdsa.ecdsa import Signature as _ecdsa_signature
from ecdsa.ecdsa import generator_secp256k1 as _SECP256K1_GENERATOR

from .keccak import keccak256

CURVE = SECP256k1
CURVE_ORDER = CURVE.order
_HALF_ORDER = CURVE_ORDER // 2


class Eip712Error(ValueError):
    """Raised when typed data cannot be encoded or a signature is malformed."""


# --------------------------------------------------------------------------
# Typed-data encoding (EIP-712 section 3)
# --------------------------------------------------------------------------


def encode_type(primary_type: str, types: dict[str, list[dict[str, str]]]) -> str:
    """Render the canonical type string, e.g. ``Mail(Person from,...)``."""
    rendered = [f"{primary_type}({_render_fields(primary_type, types)})"]
    deps = set(_dependencies(primary_type, types))
    deps.discard(primary_type)
    for dep in sorted(deps):
        rendered.append(_render_type(dep, types))
    return "".join(rendered)


def _render_type(name: str, types: dict[str, list[dict[str, str]]]) -> str:
    return f"{name}({_render_fields(name, types)})"


def _render_fields(name: str, types: dict[str, list[dict[str, str]]]) -> str:
    """Fields render in declaration order.

    EIP-712 sorts *dependencies* alphabetically but preserves struct field
    order as declared. Sorting fields here silently produces a different
    typehash and therefore unverifiable signatures.
    """
    fields = types.get(name)
    if fields is None:
        raise Eip712Error(f"type {name!r} is not defined in the type map")
    return ",".join(f"{f['type']} {f['name']}" for f in fields)


def _dependencies(primary_type: str, types: dict[str, list[dict[str, str]]], found: set[str] | None = None) -> set[str]:
    if found is None:
        found = set()
    if primary_type in found:
        return found
    found.add(primary_type)
    for field in types.get(primary_type, []):
        base = field["type"].split("[")[0]
        if base in types:
            _dependencies(base, types, found)
    return found


def _hash_struct(primary_type: str, types: dict[str, list[dict[str, str]]], data: Any) -> bytes:
    """keccak256(typeHash ‖ encodeData(message))."""
    encoded_type = keccak256(encode_type(primary_type, types).encode("ascii"))
    encoded_data = _encode_data(primary_type, types, data)
    return keccak256(encoded_type + encoded_data)


def _encode_data(primary_type: str, types: dict[str, list[dict[str, str]]], data: Any) -> bytes:
    """encodeData: concatenate each field's encoding. No typeHash prefix here;
    _hash_struct adds it."""
    buffer = bytearray()

    def encode_field(name: str, ftype: str, value: Any) -> None:
        if ftype.endswith("]"):
            base = ftype.split("[")[0]
            if base in types:
                for item in value:
                    buffer.extend(keccak256(encode_struct(base, item)))
            else:
                for item in value:
                    buffer.extend(encode_value(base, item))
            return

        if ftype in types:
            buffer.extend(keccak256(encode_struct(ftype, value)))
        else:
            buffer.extend(encode_value(ftype, value))

    def encode_struct(struct_type: str, value: Any) -> bytes:
        """A nested struct encodes as keccak256(typeHash ‖ encodeData)."""
        type_hash = keccak256(encode_type(struct_type, types).encode("ascii"))
        return type_hash + _encode_data(struct_type, types, value)

    for field in types[primary_type]:  # declaration order, see _render_fields
        encode_field(primary_type, field["type"], data[field["name"]])
    return bytes(buffer)


def encode_value(ftype: str, value: Any) -> bytes:
    """ABI-encode one atomic value per EIP-712 section 3.2."""
    if ftype == "address":
        return bytes(12) + to_bytes20(value)
    if ftype == "bool":
        return bytes(31) + (b"\x01" if value else b"\x00")
    if ftype == "string":
        raw = value.encode("utf-8") if isinstance(value, str) else bytes(value)
        return keccak256(raw)
    if ftype == "bytes":
        raw = value if isinstance(value, (bytes, bytearray)) else bytes.fromhex(str(value).removeprefix("0x"))
        return keccak256(bytes(raw))
    if ftype.startswith("bytes") and ftype[5:].isdigit():
        size = int(ftype[5:])
        raw = value if isinstance(value, (bytes, bytearray)) else bytes.fromhex(str(value).removeprefix("0x"))
        if len(raw) != size:
            raise Eip712Error(f"{ftype} expects {size} bytes, got {len(raw)}")
        return bytes(raw).rjust(32, b"\x00")
    if ftype.startswith("uint") or ftype.startswith("int"):
        return int(value).to_bytes(32, "big", signed=ftype.startswith("int"))
    raise Eip712Error(f"unsupported EIP-712 type {ftype!r}")


def to_bytes20(address: str) -> bytes:
    """Normalise a 0x-prefixed 20-byte hex address to raw bytes."""
    if not isinstance(address, str) or not address.startswith("0x") or len(address) != 42:
        raise Eip712Error(f"invalid address {address!r}")
    return bytes.fromhex(address[2:])


def domain_separator(domain: dict[str, Any]) -> bytes:
    """EIP-712Domain hash over the domain fields in declaration order."""
    types = {
        "EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"},
            {"name": "verifyingContract", "type": "address"},
        ]
    }
    payload = {
        "name": domain.get("name", ""),
        "version": domain.get("version", ""),
        "chainId": domain.get("chainId", 1),
        "verifyingContract": domain.get("verifyingContract", "0x" + "00" * 20),
    }
    return _hash_struct("EIP712Domain", types, payload)


def hash_typed_data(domain: dict[str, Any], types: dict[str, list[dict[str, str]]], primary_type: str, message: Any) -> bytes:
    """Return the 32-byte EIP-712 digest: keccak256(0x1901 || domainSeparator || hashStruct)."""
    return keccak256(b"\x19\x01" + domain_separator(domain) + _hash_struct(primary_type, types, message))


# --------------------------------------------------------------------------
# Signing / recovery
# --------------------------------------------------------------------------


def _rfc6979_k(private_key: bytes, digest: bytes) -> int:
    """Deterministic nonce per RFC 6979 section 3.2 with HMAC-SHA256."""
    x = private_key
    h1 = digest
    v = b"\x01" * 32
    k = b"\x00" * 32
    k = hmac.new(k, v + b"\x00" + x + h1, hashlib.sha256).digest()
    v = hmac.new(k, v, hashlib.sha256).digest()
    k = hmac.new(k, v + b"\x01" + x + h1, hashlib.sha256).digest()
    v = hmac.new(k, v, hashlib.sha256).digest()
    while True:
        v = hmac.new(k, v, hashlib.sha256).digest()
        candidate = int.from_bytes(v, "big")
        if 1 <= candidate < CURVE_ORDER:
            return candidate
        k = hmac.new(k, v + b"\x00", hashlib.sha256).digest()
        v = hmac.new(k, v, hashlib.sha256).digest()


@dataclass(frozen=True)
class Signature:
    r: int
    s: int
    recovery_id: int

    @property
    def v(self) -> int:
        """Ethereum-style recovery byte (27 / 28)."""
        return 27 + self.recovery_id

    def to_hex(self) -> str:
        return "0x" + self.r.to_bytes(32, "big").hex() + self.s.to_bytes(32, "big").hex() + f"{self.v:02x}"

    @classmethod
    def from_hex(cls, signature: str) -> "Signature":
        raw = signature.removeprefix("0x")
        if len(raw) != 130:
            raise Eip712Error("signature must be 65 bytes (130 hex chars)")
        r = int(raw[0:64], 16)
        s = int(raw[64:128], 16)
        v = int(raw[128:130], 16)
        return cls(r=r, s=s, recovery_id=0 if v in (0, 27) else 1)


def _recovery_id_for_nonce(k: int) -> int:
    """Recovery id for nonce k: parity of R.y, plus 2 if R.x overflows the order.

    This must come from the point R = k*G, not from ``k & 1``. The parity of
    the nonce and the parity of R.y are unrelated, so deriving v from k yields
    a plausible-looking signature that recovers the wrong address on roughly
    half of all inputs.
    """
    R = (_SECP256K1_GENERATOR * k).to_affine()
    return (1 if R.y() % 2 else 0) + (2 if R.x() >= CURVE_ORDER else 0)


def sign_digest(digest: bytes, private_key: bytes | str) -> Signature:
    """Sign a 32-byte digest, producing a canonical low-s signature (EIP-2)."""
    key_bytes = _normalise_private_key(private_key)
    signing_key = SigningKey.from_string(key_bytes, curve=CURVE)
    k = _rfc6979_k(key_bytes, digest)
    # sigencode returns exactly what sign_digest hands back, so a 2-tuple
    # unpacks to (r, s) here.
    r, s = signing_key.sign_digest(
        digest,
        k=k,
        sigencode=lambda r_, s_, order: (r_, s_),
        allow_truncate=True,
    )
    recovery_id = _recovery_id_for_nonce(k)
    # Normalise to low-s; negating s flips the y-parity bit of R.
    if s > _HALF_ORDER:
        s = CURVE_ORDER - s
        recovery_id ^= 1
    return Signature(r=r, s=s, recovery_id=recovery_id)


def recover_address(digest: bytes, signature: Signature, expected: str | None = None) -> str:
    """Recover the signer address for ``signature`` over ``digest``.

    ECDSA recovery yields two candidate keys (R with even y and R with odd y),
    both of which verify the signature. ``ecdsa`` returns them in that order,
    so ``recovery_id`` selects between them: 0 -> even-y candidate,
    1 -> odd-y candidate. Returning the first candidate unconditionally
    recovers a valid-but-wrong address roughly half the time.
    """
    if signature.recovery_id not in (0, 1):
        raise Eip712Error(f"invalid recovery id {signature.recovery_id}")
    if not (1 <= signature.r < CURVE_ORDER) or not (1 <= signature.s < CURVE_ORDER):
        raise Eip712Error("signature values out of range")

    try:
        candidates = _ecdsa_signature(signature.r, signature.s).recover_public_keys(
            int.from_bytes(digest, "big"), _SECP256K1_GENERATOR
        )
    except Exception as exc:  # noqa: BLE001
        # A corrupted r is frequently not a valid curve x-coordinate, which
        # ecdsa reports as SquareRootError. Any recovery failure means the
        # signature is unusable, so surface it as a signature error rather
        # than letting it escape as a 500.
        raise Eip712Error("signature is not recoverable") from exc

    addresses = [
        address_from_public_key(
            b"\x04" + candidate.point.x().to_bytes(32, "big") + candidate.point.y().to_bytes(32, "big")
        )
        for candidate in candidates
    ]

    if expected is not None:
        wanted = expected.lower().removeprefix("0x")
        for address in addresses:
            if address.removeprefix("0x") == wanted:
                return address
        raise Eip712Error(f"no recovered signer matches {expected}")
    return addresses[signature.recovery_id]


def address_from_public_key(public_key: bytes) -> str:
    """Ethereum address = last 20 bytes of keccak256(uncompressed pubkey without 0x04)."""
    body = public_key[1:] if len(public_key) == 65 and public_key[0] == 0x04 else public_key
    return "0x" + keccak256(body)[-20:].hex()


def public_key_to_address(signing_key: SigningKey) -> str:
    return address_from_public_key(signing_key.get_verifying_key().to_string())


def _normalise_private_key(private_key: bytes | str) -> bytes:
    if isinstance(private_key, bytes):
        raw = private_key
    else:
        text = private_key[2:] if private_key.startswith("0x") else private_key
        raw = bytes.fromhex(text)
    if len(raw) != 32:
        raise Eip712Error("private key must be 32 bytes")
    value = int.from_bytes(raw, "big")
    if not 0 < value < CURVE_ORDER:
        raise Eip712Error("private key out of secp256k1 range")
    return raw


def address_from_private_key(private_key: bytes | str) -> str:
    """Derive the EOA address for a secp256k1 private key."""
    return public_key_to_address(SigningKey.from_string(_normalise_private_key(private_key), curve=CURVE))