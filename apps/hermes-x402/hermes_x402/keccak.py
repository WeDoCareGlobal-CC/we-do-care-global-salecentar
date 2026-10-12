"""Pure-Python Keccak-256 (Ethereum's hash, not NIST SHA3-256).

Why this exists: Ethereum's keccak256 uses the original Keccak padding byte
0x01, while hashlib.sha3_256 uses the finalized NIST SHA-3 padding 0x06. The two
produce completely different digests, so hashlib is unusable for EIP-712 /
EIP-3009 hashing. The usual fixes are pycryptodome, eth-hash or pysha3, none of
which build on aarch64 Termux (no compiler toolchain for bitarray/ckzg/regex),
so this module implements Keccak-f[1600] from scratch on top of pure Python.

Verified against the published vectors in tests/test_vectors.py.
"""

from __future__ import annotations

_MASK64 = (1 << 64) - 1

# Round constants of Keccak-f[1600].
_ROUND_CONSTANTS = (
    0x0000000000000001, 0x0000000000008082, 0x800000000000808A, 0x8000000080008000,
    0x000000000000808B, 0x0000000080000001, 0x8000000080008081, 0x8000000000008009,
    0x000000000000008A, 0x0000000000000088, 0x0000000080008009, 0x000000008000000A,
    0x000000008000808B, 0x800000000000008B, 0x8000000000008089, 0x8000000000008003,
    0x8000000000008002, 0x8000000000000080, 0x000000000000800A, 0x800000008000000A,
    0x8000000080008081, 0x8000000000008080, 0x0000000080000001, 0x8000000080008008,
)

# Rotation offsets, indexed as _ROTATION_OFFSETS[x][y].
_ROTATION_OFFSETS = (
    (0, 36, 3, 41, 18),
    (1, 44, 10, 45, 2),
    (62, 6, 43, 15, 61),
    (28, 55, 25, 21, 56),
    (27, 20, 39, 8, 14),
)

_RATE_BYTES = 136  # 1088 bits, the rate for a 256-bit Keccak digest


def _rotl64(value: int, shift: int) -> int:
    if shift == 0:
        return value & _MASK64
    return ((value << shift) | (value >> (64 - shift))) & _MASK64


def _keccak_f1600(state: list[int]) -> None:
    """In-place 24-round Keccak-f[1600] permutation on 25 64-bit lanes.

    Lane layout is state[x + 5 * y].
    """
    for round_constant in _ROUND_CONSTANTS:
        # theta
        column_parity = [
            state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]
            for x in range(5)
        ]
        correction = [
            column_parity[(x - 1) % 5] ^ _rotl64(column_parity[(x + 1) % 5], 1)
            for x in range(5)
        ]
        for x in range(5):
            for y in range(5):
                state[x + 5 * y] ^= correction[x]

        # rho (rotate) + pi (permute)
        permuted = [0] * 25
        for x in range(5):
            for y in range(5):
                permuted[y + 5 * ((2 * x + 3 * y) % 5)] = _rotl64(
                    state[x + 5 * y], _ROTATION_OFFSETS[x][y]
                )

        # chi
        for x in range(5):
            for y in range(5):
                state[x + 5 * y] = permuted[x + 5 * y] ^ (
                    (~permuted[(x + 1) % 5 + 5 * y]) & _MASK64 & permuted[(x + 2) % 5 + 5 * y]
                )

        # iota
        state[0] ^= round_constant


def keccak256(data: bytes) -> bytes:
    """Return the 32-byte Ethereum keccak256 digest of ``data``."""
    if isinstance(data, str):
        raise TypeError("keccak256 expects bytes, not str")
    state = [0] * 25

    padded = bytearray(data)
    padded.append(0x01)  # Keccak padding, NOT the SHA3 0x06
    while len(padded) % _RATE_BYTES != 0:
        padded.append(0x00)
    padded[-1] ^= 0x80

    for offset in range(0, len(padded), _RATE_BYTES):
        block = padded[offset : offset + _RATE_BYTES]
        for lane in range(_RATE_BYTES // 8):
            state[lane] ^= int.from_bytes(block[lane * 8 : lane * 8 + 8], "little")
        _keccak_f1600(state)

    out = bytearray()
    for lane in range(4):  # 32 bytes of digest, well under the 136-byte rate
        out += state[lane].to_bytes(8, "little")
    return bytes(out)