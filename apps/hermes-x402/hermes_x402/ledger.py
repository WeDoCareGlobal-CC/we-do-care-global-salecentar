"""Append-only profit ledger for x402 settlements.

Money accounting has two hard requirements that SQLite gives us cheaply:
settlements are immutable once recorded, and the balance is derived by summing
the ledger rather than by mutating a running total. A ``settlements`` table
with a unique constraint on ``nonce`` makes replayed authorizations
impossible to double-count even if the caller retries.
"""

from __future__ import annotations

import json
import sqlite3
import time
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS settlements (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at     REAL    NOT NULL,
    network        TEXT    NOT NULL,
    asset          TEXT    NOT NULL,
    payer          TEXT    NOT NULL,
    pay_to         TEXT    NOT NULL,
    amount_atomic  TEXT    NOT NULL,
    amount_usdc    TEXT    NOT NULL,
    nonce          TEXT    NOT NULL UNIQUE,
    -- Column is tx_hash, not transaction: TRANSACTION is a SQLite reserved
    -- word and cannot be used unquoted. The wire field stays "transaction".
    tx_hash        TEXT    NOT NULL,
    resource       TEXT    NOT NULL,
    status         TEXT    NOT NULL,
    detail         TEXT
);

CREATE INDEX IF NOT EXISTS idx_settlements_created ON settlements (created_at);
CREATE INDEX IF NOT EXISTS idx_settlements_resource ON settlements (resource);

CREATE TABLE IF NOT EXISTS services (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at     REAL    NOT NULL,
    resource       TEXT    NOT NULL UNIQUE,
    description    TEXT    NOT NULL,
    amount_atomic  TEXT    NOT NULL,
    call_count     INTEGER NOT NULL DEFAULT 0,
    failure_count  INTEGER NOT NULL DEFAULT 0
);

-- Every rejected payment attempt, for abuse analysis.
CREATE TABLE IF NOT EXISTS rejections (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at   REAL NOT NULL,
    network      TEXT,
    payer        TEXT,
    code         TEXT NOT NULL,
    resource     TEXT
);

CREATE INDEX IF NOT EXISTS idx_rejections_created ON rejections (created_at);
"""


def atomic_to_usdc(amount_atomic: int | str, decimals: int = 6) -> Decimal:
    """Convert atomic token units to a Decimal USDC amount (never float)."""
    return Decimal(str(amount_atomic)) / (Decimal(10) ** decimals)


@dataclass(frozen=True)
class ProfitSummary:
    gross_usdc: Decimal
    successful: int
    failed: int
    rejected: int

    @property
    def net_collected_usdc(self) -> Decimal:
        """Settled value. Failed settlements move no funds, so they add nothing."""
        return self.gross_usdc

    @property
    def average_usdc(self) -> Decimal:
        if not self.successful:
            return Decimal(0)
        return self.gross_usdc / self.successful


class Ledger:
    """SQLite-backed settlement ledger.

    Usable as a context manager; ``sqlite3`` connections are not shareable
    across threads by default, so each instance opens its own.
    """

    def __init__(self, path: str | Path = ":memory:") -> None:
        self.path = str(path)
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.path, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        # WAL keeps a reader from blocking the writer during settlement.
        if self.path != ":memory:":
            self.connection.execute("PRAGMA journal_mode=WAL")
        self.connection.execute("PRAGMA foreign_keys=ON")
        self.connection.executescript(SCHEMA)
        self.connection.commit()

    def close(self) -> None:
        self.connection.close()

    def __enter__(self) -> "Ledger":
        return self

    def __exit__(self, *exc: object) -> None:
        self.close()

    # -- writes ---------------------------------------------------------

    def register_service(
        self, resource: str, description: str, amount_atomic: int
    ) -> None:
        self.connection.execute(
            """
            INSERT INTO services (created_at, resource, description, amount_atomic)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(resource) DO UPDATE SET
                description = excluded.description,
                amount_atomic = excluded.amount_atomic
            """,
            (time.time(), resource, description, str(amount_atomic)),
        )
        self.connection.commit()

    def record_settlement(
        self,
        *,
        network: str,
        asset: str,
        payer: str,
        pay_to: str,
        amount_atomic: int,
        nonce: str,
        tx_hash: str,
        resource: str,
        status: str = "settled",
        detail: dict[str, Any] | None = None,
        decimals: int = 6,
    ) -> int:
        """Insert a settlement. Raises on a replayed nonce."""
        cursor = self.connection.execute(
            """
            INSERT INTO settlements
                (created_at, network, asset, payer, pay_to, amount_atomic,
                 amount_usdc, nonce, tx_hash, resource, status, detail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                time.time(),
                network,
                asset,
                payer,
                pay_to,
                str(amount_atomic),
                str(atomic_to_usdc(amount_atomic, decimals)),
                nonce,
                tx_hash,
                resource,
                status,
                json.dumps(detail) if detail else None,
            ),
        )
        self.connection.execute(
            "UPDATE services SET call_count = call_count + 1 WHERE resource = ?",
            (resource,),
        )
        self.connection.commit()
        return int(cursor.lastrowid or 0)

    def record_rejection(self, code: str, *, network: str | None = None, payer: str | None = None, resource: str | None = None) -> None:
        self.connection.execute(
            "INSERT INTO rejections (created_at, network, payer, code, resource) VALUES (?, ?, ?, ?, ?)",
            (time.time(), network, payer, code, resource),
        )
        self.connection.commit()

    def record_failure(self, resource: str, payer: str, network: str, amount_atomic: int, nonce: str, reason: str) -> None:
        """Record a settlement that failed on-chain (no funds moved)."""
        self.record_settlement(
            network=network,
            asset="",
            payer=payer,
            pay_to="",
            amount_atomic=amount_atomic,
            nonce=nonce,
            tx_hash="",
            resource=resource,
            status="failed",
            detail={"reason": reason},
        )
        self.connection.execute(
            "UPDATE services SET failure_count = failure_count + 1 WHERE resource = ?",
            (resource,),
        )
        self.connection.commit()

    # -- reads ----------------------------------------------------------

    def nonce_seen(self, nonce: str) -> bool:
        """True if this authorization nonce was already consumed (replay guard)."""
        row = self.connection.execute(
            "SELECT 1 FROM settlements WHERE nonce = ? LIMIT 1", (nonce,)
        ).fetchone()
        return row is not None

    def settlement_mode_totals(self) -> dict[str, dict[str, str | int]]:
        """Only facilitator-confirmed entries qualify as collected funds."""
        rows = self.connection.execute(
            "SELECT amount_atomic, detail, status FROM settlements"
        ).fetchall()
        result = {"confirmed": {"amount_atomic": 0, "count": 0},
                  "simulated": {"amount_atomic": 0, "count": 0},
                  "unverified": {"amount_atomic": 0, "count": 0}}
        for row in rows:
            if row["status"] != "settled":
                continue
            try:
                detail = json.loads(row["detail"] or "{}")
            except (ValueError, TypeError):
                detail = {}
            mode = ("simulated" if detail.get("simulated") is True else
                    "confirmed" if detail.get("simulated") is False and detail.get("settled_at") else
                    "unverified")
            result[mode]["amount_atomic"] += int(row["amount_atomic"])
            result[mode]["count"] += 1
        return {mode: {"amount_atomic": str(v["amount_atomic"]), "count": v["count"],
                       "usdc": str(atomic_to_usdc(v["amount_atomic"]))}
                for mode, v in result.items()}

    def summary(self, since: float | None = None) -> ProfitSummary:
        query = "SELECT amount_usdc FROM settlements WHERE status = 'settled'"
        params: tuple[Any, ...] = ()
        if since is not None:
            query += " AND created_at >= ?"
            params = (since,)
        amounts = self.connection.execute(query, params).fetchall()
        gross = sum((Decimal(row[0]) for row in amounts), Decimal(0))
        failed = self.connection.execute(
            "SELECT COUNT(*) FROM settlements WHERE status = 'failed'"
        ).fetchone()[0]
        rejected = self.connection.execute("SELECT COUNT(*) FROM rejections").fetchone()[0]
        return ProfitSummary(gross, len(amounts), int(failed), int(rejected))

    def revenue_by_resource(self, since: float | None = None) -> list[dict[str, Any]]:
        query = "SELECT resource, amount_usdc FROM settlements WHERE status = 'settled'"
        params: tuple[Any, ...] = ()
        if since is not None:
            query += " AND created_at >= ?"
            params = (since,)
        totals: dict[str, list[Decimal]] = {}
        for row in self.connection.execute(query, params):
            totals.setdefault(row["resource"], []).append(Decimal(row["amount_usdc"]))
        return [
            {"resource": resource, "calls": len(amounts),
             "revenue_usdc": str(sum(amounts, Decimal(0))),
             "avg_usdc": str(sum(amounts, Decimal(0)) / len(amounts))}
            for resource, amounts in sorted(totals.items(),
                key=lambda item: sum(item[1], Decimal(0)), reverse=True)
        ]

    def unique_payers(self, since: float | None = None) -> int:
        where = "WHERE status = 'settled'"
        params: tuple[Any, ...] = ()
        if since is not None:
            where += " AND created_at >= ?"
            params = (since,)
        row = self.connection.execute(
            f"SELECT COUNT(DISTINCT payer) FROM settlements {where}", params
        ).fetchone()
        return int(row[0] or 0)

    def top_payers(self, limit: int = 10) -> list[dict[str, Any]]:
        rows = self.connection.execute(
            "SELECT payer, amount_usdc FROM settlements WHERE status = 'settled'"
        ).fetchall()
        totals: dict[str, list[Decimal]] = {}
        for row in rows:
            totals.setdefault(row["payer"], []).append(Decimal(row["amount_usdc"]))
        return [
            {"payer": payer, "calls": len(values),
             "revenue_usdc": str(sum(values, Decimal(0)))}
            for payer, values in sorted(totals.items(),
                key=lambda item: sum(item[1], Decimal(0)), reverse=True)[:limit]
        ]

    def rejection_breakdown(self, limit: int = 10) -> list[dict[str, Any]]:
        rows = self.connection.execute(
            """
            SELECT code, COUNT(*) AS count
            FROM rejections GROUP BY code ORDER BY count DESC LIMIT ?
            """,
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]

    def recent_settlements(self, limit: int = 20) -> list[dict[str, Any]]:
        rows = self.connection.execute(
            "SELECT * FROM settlements ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(row) for row in rows]