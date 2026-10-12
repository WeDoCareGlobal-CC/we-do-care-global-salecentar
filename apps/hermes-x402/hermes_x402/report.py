"""Profit report over the settlement ledger.

    python -m hermes_x402.report --db x402_profit.db
"""

from __future__ import annotations

import argparse
import sys
from decimal import Decimal

from .ledger import Ledger


def format_report(ledger: Ledger) -> str:
    summary = ledger.summary()
    lines: list[str] = []

    lines.append("=" * 52)
    lines.append("  x402 profit ledger")
    lines.append("=" * 52)
    lines.append(f"  Gross revenue     {summary.gross_usdc:.6f} USDC")
    lines.append(f"  Settled payments  {summary.successful}")
    lines.append(f"  Failed settlements {summary.failed}")
    lines.append(f"  Rejected payments {summary.rejected}")
    lines.append(f"  Unique payers     {ledger.unique_payers()}")
    lines.append(f"  Avg per payment   {summary.average_usdc:.6f} USDC")

    by_resource = ledger.revenue_by_resource()
    if by_resource:
        lines.append("")
        lines.append("By resource")
        for row in by_resource:
            lines.append(
                f"  {row['resource']:<28} {row['calls']:>4} calls"
                f"  {Decimal(str(row['revenue_usdc'])):.6f} USDC"
            )

    top = ledger.top_payers(limit=5)
    if top:
        lines.append("")
        lines.append("Top payers")
        for row in top:
            lines.append(
                f"  {row['payer']}  {row['calls']} calls"
                f"  {Decimal(str(row['revenue_usdc'])):.6f} USDC"
            )

    rejections = ledger.rejection_breakdown()
    if rejections:
        lines.append("")
        lines.append("Rejections by cause")
        for row in rejections:
            lines.append(f"  {row['code']:<52} {row['count']}")

    recent = ledger.recent_settlements(limit=5)
    if recent:
        lines.append("")
        lines.append("Recent settlements")
        for row in recent:
            lines.append(
                f"  {row['created_at']:.0f}  {row['status']:<8}"
                f" {Decimal(str(row['amount_usdc'])):.6f} USDC"
                f"  {row['payer'][:10]}...  {row['resource']}"
            )

    lines.append("=" * 52)
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Report x402 settlement revenue")
    parser.add_argument("--db", default="x402_profit.db")
    parser.add_argument("--json", action="store_true", help="emit JSON instead")
    args = parser.parse_args()

    with Ledger(args.db) as ledger:
        if args.json:
            summary = ledger.summary()
            import json as json_module

            payload = {
                "gross_usdc": str(summary.gross_usdc),
                "settled": summary.successful,
                "failed": summary.failed,
                "rejected": summary.rejected,
                "unique_payers": ledger.unique_payers(),
                "by_resource": ledger.revenue_by_resource(),
                "top_payers": ledger.top_payers(),
            }
            print(json_module.dumps(payload, indent=2))
        else:
            print(format_report(ledger))
    return 0


if __name__ == "__main__":
    sys.exit(main())