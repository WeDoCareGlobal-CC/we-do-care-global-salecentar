"""Manually synchronize Hermes ledger events to SaleCentar (no payment initiation)."""
import argparse
import hashlib
import hmac
import json
import os
import sqlite3
import time
import urllib.request
from datetime import datetime, timezone

def collect(path):
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    try:
        rows = db.execute("SELECT * FROM settlements WHERE status='settled' ORDER BY id").fetchall()
        out = []
        for row in rows:
            try:
                detail = json.loads(row["detail"] or "{}")
            except (TypeError, ValueError):
                detail = {}
            mode = ("simulated" if detail.get("simulated") is True else
                    "facilitator_reported" if detail.get("simulated") is False and detail.get("settled_at") else
                    "unverified")
            if not row["tx_hash"] or len(row["tx_hash"]) != 66 or not row["tx_hash"].startswith("0x"):
                continue
            if not all(c in "0123456789abcdefABCDEF" for c in row["tx_hash"][2:]):
                continue
            out.append(dict(network=row["network"], tx_hash=row["tx_hash"],
                nonce=row["nonce"], asset=row["asset"], amount_atomic=row["amount_atomic"],
                payer=row["payer"], pay_to=row["pay_to"], resource=row["resource"],
                settlement_mode=mode,
                source_created_at=datetime.fromtimestamp(row["created_at"], timezone.utc).isoformat()))
        return out
    finally:
        db.close()

def send(url, secret, rows):
    body = json.dumps({"format":"wdcg-hermes-settlements-v1","settlements":rows}, separators=(",",":")).encode()
    stamp = str(int(time.time()*1000))
    signature = "sha256="+hmac.new(secret.encode(),stamp.encode()+b"."+body,hashlib.sha256).hexdigest()
    request = urllib.request.Request(url.rstrip("/")+"/sync/hermes", data=body,
        headers={"Content-Type":"application/json","x-wdc-timestamp":stamp,"x-wdc-signature":signature},
        method="POST")
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.load(response)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=os.getenv("HERMES_LEDGER_PATH", "hermes.db"))
    parser.add_argument("--url", default=os.getenv("SALECENTAR_URL", "http://127.0.0.1:3101"))
    parser.add_argument("--send", action="store_true", help="Explicitly send signed ledger data")
    args = parser.parse_args()
    records = collect(args.db)
    print(json.dumps({"records":len(records),"modes":{m:sum(r["settlement_mode"]==m for r in records) for m in ("simulated","unverified","facilitator_reported")}}))
    if args.send:
        secret = os.environ.get("SALECENTAR_HERMES_SECRET","")
        if len(secret)<32:
            parser.error("SALECENTAR_HERMES_SECRET must be at least 32 characters")
        for i in range(0,len(records),100):
            print(json.dumps(send(args.url,secret,records[i:i+100])))
