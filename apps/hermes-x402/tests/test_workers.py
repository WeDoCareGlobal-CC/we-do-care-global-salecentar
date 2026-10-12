"""Tests for the paid workers.

Each worker must compute a *correct* answer, not merely return HTTP 200. A paid
endpoint that returns a wrong digest is worse than useless: the buyer pays for a
verifiable result and has no way to know it was wrong until it matters on-chain.
"""

from __future__ import annotations

import unittest

from hermes_x402.keccak import keccak256
from hermes_x402.profit_workers import (
    FREE_TRANSACTIONS_PER_MONTH,
    _hex_to_bytes,
    _keccak_digest,
    _settlement_math,
)


class FakeRequest:
    """Minimal stand-in for a Starlette Request with query params."""

    def __init__(self, **params: str) -> None:
        self.query_params = params


class TestHexHelper(unittest.TestCase):
    def test_strips_0x_prefix(self):
        self.assertEqual(_hex_to_bytes("0xdeadbeef"), bytes.fromhex("deadbeef"))

    def test_pads_odd_length(self):
        self.assertEqual(_hex_to_bytes("0xabc"), bytes.fromhex("0abc"))

    def test_tolerates_whitespace(self):
        self.assertEqual(_hex_to_bytes("  de ad be ef "), bytes.fromhex("deadbeef"))


class TestKeccakWorker(unittest.TestCase):
    def test_matches_the_reference_digest(self):
        result = _keccak_digest(FakeRequest(data="0x" + "ab" * 32))
        self.assertEqual(result["algorithm"], "keccak-256")
        # Must equal the library's own output, i.e. the worker did real work.
        self.assertEqual(result["digest"], "0x" + keccak256(bytes.fromhex("ab" * 32)).hex())
        self.assertEqual(result["input_bytes"], 32)

    def test_empty_input_is_the_empty_keccak_digest(self):
        result = _keccak_digest(FakeRequest())
        self.assertEqual(result["digest"], "0x" + keccak256(b"").hex())
        self.assertEqual(result["input_bytes"], 0)

    def test_known_vector(self):
        # keccak256(b"") from the Ethereum test vectors.
        self.assertEqual(
            _keccak_digest(FakeRequest())["digest"],
            "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
        )


class TestSettlementMath(unittest.TestCase):
    def test_reports_real_unit_economics(self):
        result = _settlement_math(FakeRequest(calls="1000", price_usdc="0.01"))
        self.assertEqual(result["revenue_usdc"], 10.0)
        self.assertEqual(result["free_tier_calls"], FREE_TRANSACTIONS_PER_MONTH)
        self.assertEqual(result["billable_transactions"], 0)
        self.assertEqual(result["facilitator_fees_usd"], 0.0)

    def test_charges_fees_above_the_free_tier(self):
        result = _settlement_math(FakeRequest(calls="2000", price_usdc="0.01"))
        self.assertEqual(result["billable_transactions"], 1000)
        self.assertEqual(result["facilitator_fees_usd"], 1.0)
        self.assertEqual(result["net_usd"], 19.0)

    def test_rejects_non_numeric_input_instead_of_crashing(self):
        result = _settlement_math(FakeRequest(calls="lots"))
        self.assertIn("error", result)

    def test_breakeven_price_is_the_facilitator_fee(self):
        result = _settlement_math(FakeRequest(calls="1", price_usdc="0.01"))
        self.assertEqual(result["breakeven_price_usdc"], 0.001)


if __name__ == "__main__":
    unittest.main(verbosity=2)