# hermes-x402-profit

A working x402 payment rail with profit accounting, built from the protocol
spec up. Every endpoint answers `402 Payment Required` with payment terms, the
client signs an EIP-3009 authorization, the server verifies it cryptographically
and records the settlement in an append-only ledger you can query for revenue.

No blockchain node required to run or test.

## What is real here

| Piece | Status |
|---|---|
| Keccak-256 | Implemented from scratch, validated against published vectors |
| EIP-712 typed-data hashing | Reproduces the spec's own `Mail` example digest byte-for-byte |
| EIP-712 signing (RFC 6979) | Byte-identical to the signature published in EIP-712 |
| ECDSA recovery | Verified against the official vector |
| EIP-3009 `transferWithAuthorization` | Full authorization + digest + window checks |
| x402 wire format (402, `X-PAYMENT`, `X-PAYMENT-RESPONSE`) | Per spec v1 + HTTP transport |
| Verify / reject logic | Every spec error code implemented, tested |
| Settlement | **Simulated.** Records locally, no on-chain broadcast |
| Profit ledger | Real, append-only, replay-safe |

Settlement is deliberately simulated: broadcasting `transferWithAuthorization`
needs an RPC endpoint and a funded facilitator key. The signature path is
genuine, so what you test here is what would settle on mainnet — only the
broadcast is stubbed. `hermes_x402/verification.py::settle` is where a real
facilitator call would go.

## Install

```bash
pip install -r requirements.txt
```

Python 3.11+. Only two third-party runtime deps (`ecdsa`, `httpx`) plus
`fastapi`/`uvicorn` for the server. Keccak is vendored, so no compiler needed.

## Run the server

```bash
python -m hermes_x402.server --port 8402
```

Then hit a paid endpoint — it will refuse you, correctly:

```bash
curl -i http://127.0.0.1:8402/v1/insight
```

```
HTTP/1.1 402 Payment Required
{"x402Version":1,"error":"payment required for /v1/insight",
 "accepts":[{"scheme":"exact","network":"base-sepolia",
   "maxAmountRequired":"10000","asset":"0x036CbD53842c5426634e7929541eC2318f3dCF7e",
   "payTo":"0x...","resource":"/v1/insight", ...}]}
```

Pay for it:

```bash
python -m hermes_x402.demo --url http://127.0.0.1:8402/v1/insight
```

## Endpoints

| Path | Price | Purpose |
|---|---|---|
| `/v1/insight` | 0.01 USDC | Cheapest tier |
| `/v1/market-snapshot` | 0.05 USDC | Mid tier |
| `/v1/risk-report` | 0.25 USDC | Premium tier |
| `/discovery/resources` | free | Bazaar-style catalogue with prices |
| `/supported` | free | Scheme/network support matrix |
| `/profit/summary` | free | Revenue, unique payers, rejections |
| `/profit/settlements` | free | Recent settlement rows |
| `/health` | free | Liveness + wallet address |

## Profit accounting

```bash
python -m hermes_x402.report --db x402_profit.db
```

```
Gross revenue        0.310000 USDC
Settled payments     3
Unique payers        1
Avg per payment      0.103333 USDC

By resource
  /v1/risk-report        1 call    0.250000 USDC
  /v1/market-snapshot   1 call    0.050000 USDC
  /v1/insight           1 call    0.010000 USDC
```

Money is stored as integer atomic units plus an exact `Decimal` string.
Never floats — `0.1 + 0.2` is not a real quantity, and rounding errors in a
revenue ledger become real losses at scale.

The `settlements.nonce` column is `UNIQUE`, so a replayed authorization cannot
be credited twice even if a client retries. Balance is derived by summing the
ledger, never by mutating a running total.

## Test

```bash
python tests/test_vectors.py      # crypto vs published vectors
python tests/test_protocol.py     # end-to-end over real HTTP
python tests/test_robustness.py   # malformed input, no 500s
```

33 tests. The protocol and robustness suites start a real uvicorn server on a
real port and drive it with the real client — no mocks in the payment path.

Full suite takes several minutes: pure-Python secp256k1 scalar multiplication
is the bottleneck, not the network.

## Architecture

```
hermes_x402/
  keccak.py         Keccak-256 from scratch (hashlib's sha3_256 is NOT it)
  eip712.py         typed-data hashing, RFC 6979 signing, recovery
  eip3009.py        TransferWithAuthorization authorization + validity window
  networks.py       chain configs, USDC asset addresses
  types.py          x402 wire types, base64 header codec
  ledger.py         append-only SQLite profit ledger
  verification.py   verify / settle, all spec error codes
  client.py         paying client with budget cap
  server.py         FastAPI resource server
  demo_resources.py the priced catalogue
  demo.py           CLI demo buyer
  report.py         profit report
```

## Security notes

- **Replay.** Nonces are single-use, enforced by a DB constraint *and* the
  validity window. Belt and braces: a compromised facilitator replaying a nonce
  still cannot double-credit.
- **Recipient binding.** The signature commits to `to`, so funds cannot be
  redirected by a malicious facilitator. Tested.
- **Amount binding.** The signature commits to `value`, so underpaying cannot
  slip through a facilitator that under-reports. Tested.
- **Verification before work.** A request is verified before the handler runs,
  so unpaid traffic costs no compute.
- **Window cap.** `build_authorization` refuses windows over 600s to bound
  how long a leaked authorization stays useful.
- **Fail closed.** Every parse path returns an x402 error code. The fuzz suite
  exists because an earlier version 500'd on a corrupted `r` — reachable by
  anyone on the internet.

## Production notes

Before real money:

1. Replace `settle()` with a facilitator call or a direct
   `transferWithAuthorization` broadcast.
2. Fund a facilitator key with native gas (Base ETH).
3. Swap the deterministic dev key for a real wallet — `DEV_PRIVATE_KEY` is
   public knowledge.
4. Serve over TLS. Wallets and facilitators expect HTTPS in production.
5. Rate-limit per payer; the ledger tracks rejections for this.

## Licence

MIT