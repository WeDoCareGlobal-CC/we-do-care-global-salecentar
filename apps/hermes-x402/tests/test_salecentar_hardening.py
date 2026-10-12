"""Tests for financial access control and honest accounting."""
import os
import unittest
from unittest.mock import patch
from hermes_x402.ledger import Ledger

class LedgerSafetyTests(unittest.TestCase):
    def test_mode_totals_separate_simulation(self):
        ledger = Ledger()
        for i, simulated in enumerate((True, False, None)):
            detail = {"simulated": simulated, "settled_at": 123} if simulated is not None else {}
            ledger.record_settlement(network="base-sepolia", asset="USDC",
                payer="payer", pay_to="wallet", amount_atomic=1000000+i,
                nonce=f"test-{i}", tx_hash=f"hash-{i}", resource="/test",
                detail=detail)
        totals = ledger.settlement_mode_totals()
        self.assertEqual(totals["confirmed"]["amount_atomic"], "1000001")
        self.assertEqual(totals["simulated"]["amount_atomic"], "1000000")
        self.assertEqual(totals["unverified"]["amount_atomic"], "1000002")
        self.assertEqual(str(ledger.summary().gross_usdc), "3.000003")
        ledger.close()

    def test_exact_decimal_totals(self):
        ledger = Ledger()
        for i in range(100):
            ledger.record_settlement(network="base-sepolia", asset="USDC",
                payer="payer", pay_to="wallet", amount_atomic=1,
                nonce=f"cent-{i}", tx_hash=f"hash-{i}", resource="/test",
                detail={"simulated": True})
        self.assertEqual(str(ledger.summary().gross_usdc), "0.000100")
        ledger.close()

class FinancialAccessTests(unittest.TestCase):
    def test_financial_endpoints_fail_closed(self):
        try:
            from fastapi.testclient import TestClient
            from hermes_x402.server import X402Server
        except ImportError:
            self.skipTest("FastAPI/httpx dependencies unavailable")
        with patch.dict(os.environ, {"HERMES_ADMIN_API_KEY": "a-private-test-secret"}):
            server = X402Server(ledger=Ledger())
            client = TestClient(server.app)
            for path in ("/profit/summary", "/profit/settlements", "/dashboard", "/"):
                self.assertEqual(client.get(path).status_code, 403)
                self.assertEqual(client.get(path, headers={"x-hermes-admin-key": "wrong"}).status_code, 403)
            r = client.get("/profit/summary", headers={"x-hermes-admin-key": "a-private-test-secret"})
            self.assertEqual(r.status_code, 200)
            self.assertIn("settlement_modes", r.json())
            server.ledger.close()

if __name__ == "__main__":
    unittest.main()
