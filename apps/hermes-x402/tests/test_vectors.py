"""Cryptographic vectors: keccak256, EIP-712, EIP-3009.

These are the anchor tests. If they pass, the from-scratch keccak and EIP-712
implementation is byte-compatible with real Ethereum tooling; if they fail,
nothing else in the project can be trusted.
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from hermes_x402.eip3009 import TRANSFER_WITH_AUTHORIZATION_TYPES, authorization_digest
from hermes_x402.eip712 import (
    Signature,
    address_from_private_key,
    encode_type,
    hash_typed_data,
    recover_address,
    sign_digest,
)
from hermes_x402.keccak import keccak256

USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
# Private key from the EIP-712 specification's worked example.
EIP712_PRIVATE_KEY = "0xc85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4"
EIP712_SIGNER = "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"


def test_keccak256_empty() -> None:
    assert (
        keccak256(b"").hex()
        == "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
    )


def test_keccak256_abc() -> None:
    assert (
        keccak256(b"abc").hex()
        == "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45"
    )


def test_keccak256_differs_from_sha3() -> None:
    """Guards the classic mistake: hashlib.sha3_256 is NOT keccak256."""
    import hashlib

    assert keccak256(b"") .hex() != hashlib.sha3_256(b"").hexdigest()


def test_keccak256_multiblock_and_boundary() -> None:
    """Exercises the sponge padding at and around the 136-byte rate."""
    import hashlib as _h

    for length in (135, 136, 137, 272):
        data = bytes(range(256)) * 4
        data = data[:length]
        assert len(keccak256(data)) == 32
        assert keccak256(data) != _h.sha3_256(data).digest()


def test_encode_type_declaration_order_with_sorted_dependencies() -> None:
    """EIP-712 keeps struct fields in declaration order; dependencies sort alphabetically."""
    types = {
        "Person": [
            {"name": "name", "type": "string"},
            {"name": "wallet", "type": "address"},
        ],
        "Mail": [
            {"name": "from", "type": "Person"},
            {"name": "to", "type": "Person"},
            {"name": "contents", "type": "string"},
        ],
    }
    assert encode_type("Mail", types) == (
        "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
    )


def test_eip712_field_order_is_not_alphabetical() -> None:
    """Regression guard: sorting struct fields breaks every signature."""
    import copy

    from hermes_x402 import eip712

    types = {
        "Person": [{"name": "name", "type": "string"}, {"name": "wallet", "type": "address"}],
        "Mail": [
            {"name": "from", "type": "Person"},
            {"name": "to", "type": "Person"},
            {"name": "contents", "type": "string"},
        ],
    }
    message = {
        "from": {"name": "Cow", "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},
        "to": {"name": "Bob", "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},
        "contents": "Hello, Bob!",
    }
    domain = {
        "name": "Ether Mail",
        "version": "1",
        "chainId": 1,
        "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    }
    canonical = hash_typed_data(domain, copy.deepcopy(types), "Mail", message)

    shuffled = copy.deepcopy(types)
    shuffled["Mail"] = list(reversed(shuffled["Mail"]))  # alphabetical, i.e. wrong
    assert hash_typed_data(domain, shuffled, "Mail", message) != canonical


def test_eip712_official_vector() -> None:
    """Reproduces the EIP-712 spec's Mail example: digest, signature, signer."""
    domain = {
        "name": "Ether Mail",
        "version": "1",
        "chainId": 1,
        "verifyingContract": "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
    }
    types = {
        "Person": [
            {"name": "name", "type": "string"},
            {"name": "wallet", "type": "address"},
        ],
        "Mail": [
            {"name": "from", "type": "Person"},
            {"name": "to", "type": "Person"},
            {"name": "contents", "type": "string"},
        ],
    }
    message = {
        "from": {"name": "Cow", "wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},
        "to": {"name": "Bob", "wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},
        "contents": "Hello, Bob!",
    }
    digest = hash_typed_data(domain, types, "Mail", message)
    assert digest.hex() == "be609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2"

    signature = sign_digest(digest, EIP712_PRIVATE_KEY)
    assert signature.to_hex().lower() == (
        "0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d"
        "07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c"
    )
    assert address_from_private_key(EIP712_PRIVATE_KEY).lower() == EIP712_SIGNER.lower()
    recovered = recover_address(digest, Signature.from_hex(signature.to_hex()))
    assert recovered.lower() == EIP712_SIGNER.lower()


def test_recovery_id_selects_the_correct_candidate() -> None:
    """Regression guard: two candidates verify, only recovery_id disambiguates.

    Returning the first candidate regardless of recovery id recovers a
    valid-but-wrong address about half the time, which looks like random
    verification failures far from the actual bug.
    """
    from ecdsa.ecdsa import Signature as ecdsa_signature
    from ecdsa.ecdsa import generator_secp256k1 as generator

    from hermes_x402.eip712 import (
        _SECP256K1_GENERATOR,
        address_from_private_key,
        address_from_public_key,
        recover_address,
    )

    digest = keccak256(b"candidate disambiguation")
    signature = sign_digest(digest, "0x" + "77" * 32)
    candidates = ecdsa_signature(signature.r, signature.s).recover_public_keys(
        int.from_bytes(digest, "big"), generator
    )
    assert len(candidates) == 2

    recovered = [
        address_from_public_key(
            b"\x04" + c.point.x().to_bytes(32, "big") + c.point.y().to_bytes(32, "big")
        )
        for c in candidates
    ]
    signer = address_from_private_key("0x" + "77" * 32)
    # The signer's key is at index recovery_id, never blindly at index 0.
    assert recovered[signature.recovery_id].lower() == signer.lower()
    assert recover_address(digest, signature).lower() == signer.lower()


def test_recovery_id_is_not_the_nonce_parity() -> None:
    """Regression guard: v comes from R.y, not from k & 1.

    Deriving the recovery id from the nonce's low bit is the classic ECDSA
    implementation slip. It yields a well-formed 65-byte signature that
    verifies against half the keys and recovers the wrong address on the
    other half, so it survives casual testing.
    """
    from hermes_x402.eip712 import (
        CURVE_ORDER,
        _SECP256K1_GENERATOR,
        _rfc6979_k,
        address_from_private_key,
    )

    mismatches = 0
    for index in range(12):
        key = "0x" + f"{index + 1:064x}"
        digest = keccak256(f"recovery parity {index}".encode())
        signature = sign_digest(digest, key)

        k = _rfc6979_k(bytes.fromhex(key[2:]), digest)
        R = (_SECP256K1_GENERATOR * k).to_affine()
        expected_id = (1 if R.y() % 2 else 0) + (2 if R.x() >= CURVE_ORDER else 0)
        if signature.r < CURVE_ORDER and k & 1 != expected_id & 1:
            mismatches += 1

        # Whatever the id, recovery must land on the true signer.
        assert recover_address(digest, signature).lower() == address_from_private_key(key).lower()

    # Guards that the test actually exercises the divergence.
    assert mismatches > 0, "nonce parity happened to match R.y parity everywhere"


def test_eip3009_type_string() -> None:
    assert encode_type("TransferWithAuthorization", TRANSFER_WITH_AUTHORIZATION_TYPES) == (
        "TransferWithAuthorization(address from,address to,uint256 value,"
        "uint256 validAfter,uint256 validBefore,bytes32 nonce)"
    )


def test_eip3009_digest_is_deterministic_and_bound_to_fields() -> None:
    """A validBefore change must change the digest: no field is left unsigned."""
    auth = {
        "from": "0x857b06519E91e3A54538791bDbb0E22373e36b66",
        "to": "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
        "value": 10_000,
        "validAfter": 1_740_672_089,
        "validBefore": 1_740_672_154,
        "nonce": "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13480",
    }
    domain = {
        "name": "USDC",
        "version": "2",
        "chainId": 84532,
        "verifyingContract": USDC_SEPOLIA,
    }
    base = authorization_digest(domain, auth)
    assert authorization_digest(domain, auth) == base

    for field, mutated in (
        ("from", "0x857b06519E91e3A54538791bDbb0E22373e36b67"),
        ("to", "0x209693Bc6afc0C5328bA36FaF03C514EF312287D"),
        ("value", 10_001),
        ("validAfter", 1_740_672_090),
        ("validBefore", 1_740_672_155),
        ("nonce", "0xf3746613c2d920b5fdabc0856f2aeb2d4f88ee6037b8cc5d04a71a4462f13481"),
    ):
        other = dict(auth)
        other[field] = mutated
        assert authorization_digest(domain, other) != base, f"{field} is not covered by the signature"


def test_sign_then_recover_roundtrip() -> None:
    key = "0x" + "11" * 32
    address = address_from_private_key(key)
    digest = keccak256(b"hermes-x402-profit roundtrip")
    signature = sign_digest(digest, key)
    assert recover_address(digest, signature, expected=address).lower() == address.lower()
    # Signature survives the hex round-trip used on the wire.
    assert recover_address(digest, Signature.from_hex(signature.to_hex()), expected=address).lower() == address.lower()


def test_wrong_key_cannot_recover() -> None:
    digest = keccak256(b"immutability")
    signature = sign_digest(digest, "0x" + "22" * 32)
    other = address_from_private_key("0x" + "33" * 32)
    try:
        recover_address(digest, signature, expected=other)
    except Exception as exc:  # noqa: BLE001 - Eip712Error is the contract here
        assert "no recovered signer" in str(exc)
    else:  # pragma: no cover
        raise AssertionError("recovery accepted the wrong signer")


if __name__ == "__main__":
    failures = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"PASS {name}")
            except AssertionError as exc:
                failures += 1
                print(f"FAIL {name}: {exc}")
            except Exception as exc:  # noqa: BLE001
                failures += 1
                print(f"ERROR {name}: {type(exc).__name__}: {exc}")
    print(f"\n{'all vectors pass' if not failures else f'{failures} failure(s)'}")
    sys.exit(1 if failures else 0)