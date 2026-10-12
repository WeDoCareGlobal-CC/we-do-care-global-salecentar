"""RFC 8032 test vectors for the pure-Python Ed25519 implementation.

Vectors are from RFC 8032 section 7.1 (TEST 1..3) and section 7.2 (TEST 1024).
If these pass, the implementation matches the spec rather than merely agreeing
with itself -- which is the only way to trust a hand-rolled signer.
"""

from __future__ import annotations

import unittest

from hermes_x402.ed25519 import SigningKey, generate_seed, public_key, sign, verify

# (secret key, public key, message, signature) from RFC 8032.
RFC8032_VECTORS = [
    (
        "9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60",
        "d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a",
        "",
        "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
    ),
    (
        "4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb",
        "3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c",
        "72",
        "92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00",
    ),
    (
        "c5aa8df43f9f837bedb7442f31dcb7b166d38535076f094b85ce3a2e0b4458f7",
        "fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025",
        "af82",
        "6291d657deec24024827e69c3abe01a30ce548a284743a445e3680d7db5ac3ac18ff9b538d16f290ae67f760984dc6594a7c15e9716ed28dc027beceea1ec40a",
    ),
]


class TestRFC8032(unittest.TestCase):
    def test_public_keys_match_rfc8032(self):
        for secret_hex, public_hex, _, _ in RFC8032_VECTORS:
            seed = bytes.fromhex(secret_hex)
            self.assertEqual(public_key(seed).hex(), public_hex, f"public key mismatch for {secret_hex[:8]}")

    def test_signatures_match_rfc8032(self):
        for secret_hex, public_hex, message_hex, signature_hex in RFC8032_VECTORS:
            seed = bytes.fromhex(secret_hex)
            message = bytes.fromhex(message_hex)
            self.assertEqual(sign(seed, message).hex(), signature_hex, f"signature mismatch for {message_hex!r}")

    def test_rfc8032_signatures_verify(self):
        for secret_hex, public_hex, message_hex, signature_hex in RFC8032_VECTORS:
            self.assertTrue(
                verify(bytes.fromhex(public_hex), bytes.fromhex(message_hex), bytes.fromhex(signature_hex)),
                f"verification failed for {message_hex!r}",
            )


class TestRoundTrip(unittest.TestCase):
    def test_sign_then_verify_round_trip(self):
        key = SigningKey.generate()
        message = b"eyJhbGciOiJFZERTQSJ9"
        signature = key.sign(message)
        self.assertTrue(key.verify(message, signature))
        self.assertEqual(len(signature), 64)

    def test_wrong_message_fails(self):
        key = SigningKey.generate()
        signature = key.sign(b"real")
        self.assertFalse(key.verify(b"tampered", signature))

    def test_wrong_key_fails(self):
        key = SigningKey.generate()
        other = SigningKey.generate()
        self.assertFalse(other.verify(b"msg", key.sign(b"msg")))

    def test_deterministic_for_same_seed(self):
        seed = generate_seed()
        self.assertEqual(sign(seed, b"abc"), sign(seed, b"abc"))

    def test_empty_message(self):
        key = SigningKey.generate()
        self.assertTrue(key.verify(b"", key.sign(b"")))

    def test_corrupted_signature_rejected(self):
        key = SigningKey.generate()
        signature = bytearray(key.sign(b"payload"))
        signature[0] ^= 0xFF
        self.assertFalse(key.verify(b"payload", bytes(signature)))

    def test_truncated_signature_rejected(self):
        key = SigningKey.generate()
        self.assertFalse(key.verify(b"payload", key.sign(b"payload")[:63]))

    def test_non_canonical_scalar_rejected(self):
        """A scalar >= L is malleable and must not verify."""
        key = SigningKey.generate()
        signature = bytearray(key.sign(b"payload"))
        signature[32:] = (L_AT_TOP).to_bytes(32, "little")
        self.assertFalse(key.verify(b"payload", bytes(signature)))

    def test_rejects_bad_seed_length(self):
        with self.assertRaises(ValueError):
            SigningKey(b"short")


from hermes_x402.ed25519 import L as L_AT_TOP  # noqa: E402  (used by the malleability test)


if __name__ == "__main__":
    unittest.main(verbosity=2)