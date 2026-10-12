"""Tests for real (facilitator-backed) settlement.

The safety property under test: a facilitator failure must record a rejection,
never revenue. Booking a settlement that never moved on-chain is the single
failure mode that would make the profit dashboard lie.
"""

from __future__ import annotations

import unittest
from unittest import mock

from hermes_x402.onchain import FacilitatorClient, FacilitatorConfig, FacilitatorError
from hermes_x402.types import PaymentPayload, PaymentRequirements, SettlementResponse


def make_requirements(**overrides):
    base = dict(
        scheme="exact",
        network="base",
        max_amount_required="10000",
        asset="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        pay_to="0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a",
        resource="/v1/insight",
        description="test",
        mime_type="application/json",
        max_timeout_seconds=60,
        extra={"name": "USD Coin", "version": "2"},
    )
    base.update(overrides)
    return PaymentRequirements(**base)


def make_payload(**overrides):
    base = dict(
        x402_version=1,
        scheme="exact",
        network="base",
        payload={
            "signature": "0x" + "11" * 65,
            "authorization": {
                "from": "0x1111111111111111111111111111111111111111",
                "to": "0x19e7e376e7c213b7e7e7e46cc70a5dd086daff2a",
                "value": "10000",
                "validAfter": "0",
                "validBefore": "99999999999",
                "nonce": "0x" + "ab" * 32,
            },
        },
    )
    base.update(overrides)
    return PaymentPayload(**base)


class TestEnvelope(unittest.TestCase):
    def test_envelope_carries_the_terms_the_facilitator_needs(self):
        from hermes_x402.onchain import _envelope

        body = _envelope(make_payload(), make_requirements())
        # The facilitator needs to know exactly where the money must go.
        self.assertEqual(body["paymentRequirements"]["payTo"], make_requirements().pay_to)
        self.assertEqual(body["paymentRequirements"]["maxAmountRequired"], "10000")
        self.assertEqual(body["paymentRequirements"]["asset"].lower(), make_requirements().asset.lower())
        self.assertEqual(body["paymentPayload"]["scheme"], "exact")
        self.assertIn("signature", body["paymentPayload"]["payload"])

    def test_envelope_includes_eip712_domain_extra(self):
        """USDC's EIP-712 domain name differs per network; it must be forwarded."""
        from hermes_x402.onchain import _envelope

        body = _envelope(make_payload(), make_requirements(extra={"name": "USD Coin", "version": "2"}))
        self.assertEqual(body["paymentRequirements"]["extra"]["name"], "USD Coin")
        self.assertEqual(body["paymentRequirements"]["extra"]["version"], "2")


class TestSettle(unittest.TestCase):
    def setUp(self):
        self.config = FacilitatorConfig(kind="cdp", url="https://example.invalid/v2", api_key_id="k", api_secret="s")

    def _client(self):
        client = FacilitatorClient(self.config)
        # The JWT mint needs real crypto; stub it, we test transport semantics here.
        return client

    def test_settle_returns_the_real_transaction_hash(self):
        client = self._client()
        with mock.patch.object( FacilitatorClient, "_headers", return_value={"Authorization": "Bearer t"}):
            with mock.patch("httpx.post") as post:
                post.return_value = mock.Mock(
                    status_code=200,
                    json=lambda: {"success": True, "transaction": "0x" + "cd" * 32, "payer": "0xpayer"},
                )
                receipt = client.settle(make_payload(), make_requirements())
        self.assertTrue(receipt.success)
        # The hash must be the facilitator's, not a locally derived stand-in.
        self.assertEqual(receipt.transaction, "0x" + "cd" * 32)
        self.assertEqual(receipt.payer, "0xpayer")

    def test_success_without_a_hash_is_an_error_not_a_sale(self):
        client = self._client()
        with mock.patch.object(FacilitatorClient, "_headers", return_value={"Authorization": "Bearer t"}):
            with mock.patch("httpx.post") as post:
                post.return_value = mock.Mock(status_code=200, json=lambda: {"success": True})
                with self.assertRaises(FacilitatorError):
                    client.settle(make_payload(), make_requirements())

    def test_http_error_raises_with_the_facilitator_reason(self):
        client = self._client()
        with mock.patch.object(FacilitatorClient, "_headers", return_value={"Authorization": "Bearer t"}):
            with mock.patch("httpx.post") as post:
                post.return_value = mock.Mock(status_code=402, text="invalid signature")
                with self.assertRaises(FacilitatorError) as ctx:
                    client.settle(make_payload(), make_requirements())
        self.assertIn("invalid signature", str(ctx.exception))


class TestServerSettlementRouting(unittest.TestCase):
    """The server must never silently fall back to simulation."""

    def _server(self, facilitator):
        from hermes_x402.demo_resources import default_resources
        from hermes_x402.ledger import Ledger
        from hermes_x402.networks import BASE_MAINNET
        from hermes_x402.server import X402Server
        import tempfile, os

        db = os.path.join(tempfile.mkdtemp(), "t.db")
        return X402Server(
            default_resources(),
            ledger=Ledger(db),
            network=BASE_MAINNET,
            facilitator=facilitator,
        )

    def test_no_facilitator_falls_back_to_simulation(self):
        server = self._server(None)
        self.assertIsNone(server.facilitator)

    def test_facilitator_failure_records_a_rejection_not_revenue(self):
        failing = mock.Mock()
        failing.settle.side_effect = FacilitatorError("facilitator /settle returned 500")
        server = self._server(failing)
        before = server.ledger.summary().gross_usdc

        receipt = server._settle_checked(make_payload(), make_requirements(), server.ledger)

        self.assertFalse(receipt.success)
        self.assertEqual(receipt.error_reason, "facilitator_error")
        # Revenue must be untouched.
        self.assertEqual(server.ledger.summary().gross_usdc, before)

    def test_successful_facilitator_settlement_records_real_revenue(self):
        good = mock.Mock()
        good.settle.return_value = SettlementResponse(
            success=True, transaction="0x" + "ef" * 32, network="base", payer="0xpayer"
        )
        server = self._server(good)
        before = server.ledger.summary().gross_usdc

        receipt = server._settle_checked(make_payload(), make_requirements(), server.ledger)

        self.assertTrue(receipt.success)
        after = server.ledger.summary().gross_usdc
        self.assertGreater(after, before)
        rows = server.ledger.recent_settlements(limit=1)
        self.assertEqual(rows[0]["tx_hash"], "0x" + "ef" * 32)


if __name__ == "__main__":
    unittest.main(verbosity=2)