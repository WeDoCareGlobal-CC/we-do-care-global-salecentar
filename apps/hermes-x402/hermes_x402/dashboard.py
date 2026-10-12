"""Live profit dashboard served by the x402 server.

Single self-contained HTML page (no CDN, no build step) that polls
``/profit/summary`` and ``/profit/settlements``. Registered as a PWA so it can
be installed to the home screen.
"""

from __future__ import annotations

from .ledger import Ledger

DASHBOARD_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#0b0f17">
<title>x402 Profit</title>
<link rel="manifest" href="/manifest.webmanifest">
<style>
  :root {
    --bg:#0b0f17; --card:#131a26; --line:#1e2836; --text:#e6edf6;
    --dim:#8b9ab0; --good:#2ecc8f; --bad:#ff6b6b; --accent:#4da3ff;
  }
  * { box-sizing:border-box; margin:0; padding:0; }
  body {
    background:var(--bg); color:var(--text);
    font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
    padding:16px; padding-bottom:48px;
  }
  header { display:flex; align-items:baseline; gap:12px; margin-bottom:18px; flex-wrap:wrap; }
  h1 { font-size:20px; font-weight:650; letter-spacing:-.2px; }
  .sub { color:var(--dim); font-size:13px; }
  .live { display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--dim); }
  .dot { width:8px; height:8px; border-radius:50%; background:var(--good); }
  .dot.stale { background:var(--bad); }
  .grid { display:grid; gap:12px; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); margin-bottom:16px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px 16px; }
  .k { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.5px; }
  .v { font-size:26px; font-weight:650; margin-top:4px; font-variant-numeric:tabular-nums; }
  .v small { font-size:14px; color:var(--dim); font-weight:400; }
  .section { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; margin-bottom:14px; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:.6px; color:var(--dim); margin-bottom:12px; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th { text-align:left; color:var(--dim); font-weight:500; font-size:12px; padding:6px 8px 6px 0; border-bottom:1px solid var(--line); }
  td { padding:7px 8px 7px 0; border-bottom:1px solid rgba(30,40,54,.5); font-variant-numeric:tabular-nums; }
  tr:last-child td { border-bottom:none; }
  .mono { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12.5px; color:var(--dim); }
  .num { text-align:right; }
  .bar { height:8px; background:#1e2836; border-radius:4px; overflow:hidden; margin-top:6px; }
  .bar > i { display:block; height:100%; background:var(--accent); border-radius:4px; }
  .row { margin-bottom:12px; }
  .row:last-child { margin-bottom:0; }
  .row .top { display:flex; justify-content:space-between; gap:12px; font-size:14px; }
  .tag { display:inline-block; padding:2px 8px; border-radius:20px; font-size:12px; }
  .tag.ok { background:rgba(46,204,143,.14); color:var(--good); }
  .tag.no { background:rgba(255,107,107,.14); color:var(--bad); }
  .empty { color:var(--dim); font-size:14px; padding:8px 0; }
  .note { color:var(--dim); font-size:12px; margin-top:14px; line-height:1.6; }
  a { color:var(--accent); }
</style>
</head>
<body>
<header>
  <h1>x402 Profit</h1>
  <span class="sub" id="wallet"></span>
  <span class="live"><span class="dot" id="dot"></span><span id="status">connecting</span></span>
</header>

<div class="grid">
  <div class="card"><div class="k">Gross revenue</div><div class="v" id="gross">—</div></div>
  <div class="card"><div class="k">Settled</div><div class="v" id="settled">—</div></div>
  <div class="card"><div class="k">Unique payers</div><div class="v" id="payers">—</div></div>
  <div class="card"><div class="k">Avg payment</div><div class="v" id="avg">—</div></div>
  <div class="card"><div class="k">Rejected</div><div class="v" id="rejected">—</div></div>
</div>

<div class="section">
  <h2>Revenue by resource</h2>
  <div id="resources"><div class="empty">No settled payments yet.</div></div>
</div>

<div class="section">
  <h2>Top payers</h2>
  <div id="top"><div class="empty">No payers yet.</div></div>
</div>

<div class="section">
  <h2>Recent settlements</h2>
  <table>
    <thead><tr><th>Time</th><th>Resource</th><th>Payer</th><th class="num">USDC</th><th>Status</th></tr></thead>
    <tbody id="rows"><tr><td colspan="5" class="empty">Nothing settled yet.</td></tr></tbody>
  </table>
</div>

<div class="section" id="rejsec" style="display:none">
  <h2>Rejected payments by cause</h2>
  <div id="rejections"></div>
</div>

<p class="note">
  Simulated settlement: signatures are real EIP-3009 authorizations verified on-chain-style,
  but nothing is broadcast. Revenue reflects local ledger records only.
  Endpoints: <a href="/discovery/resources">/discovery/resources</a> &middot;
  <a href="/supported">/supported</a> &middot; <a href="/profit/summary">/profit/summary</a>
</p>

<script>
const fmt = n => Number(n).toFixed(6).replace(/0+$/,'').replace(/\\.$/,'') || '0';
async function load() {
  try {
    const [h, s, set] = await Promise.all([
      fetch('/health').then(r=>r.json()),
      fetch('/profit/summary').then(r=>r.json()),
      fetch('/profit/settlements?limit=12').then(r=>r.json())
    ]);
    document.getElementById('wallet').textContent = h.wallet.slice(0,10)+'… '+h.network;
    document.getElementById('gross').innerHTML = fmt(s.gross_usdc)+' <small>USDC</small>';
    document.getElementById('settled').textContent = s.successful_settlements;
    document.getElementById('payers').textContent = s.unique_payers;
    document.getElementById('avg').innerHTML = fmt(s.average_usdc)+' <small>USDC</small>';
    document.getElementById('rejected').textContent = s.rejected_payments;

    const res = s.by_resource || [];
    const max = res.reduce((m,r)=>Math.max(m, r.revenue_usdc||0), 0) || 1;
    document.getElementById('resources').innerHTML = res.length ? res.map(r => `
      <div class="row">
        <div class="top"><span class="mono">${r.resource}</span>
          <span><b>${fmt(r.revenue_usdc)}</b> <span class="sub">USDC &middot; ${r.calls} call${r.calls==1?'':'s'}</span></span></div>
        <div class="bar"><i style="width:${Math.max(2,(r.revenue_usdc/max)*100)}%"></i></div>
      </div>`).join('') : '<div class="empty">No settled payments yet.</div>';

    const top = s.top_payers || [];
    document.getElementById('top').innerHTML = top.length ? top.map(p => `
      <div class="top" style="margin-bottom:8px">
        <span class="mono">${p.payer.slice(0,14)}…</span>
        <span>${fmt(p.revenue_usdc)} USDC <span class="sub">&middot; ${p.calls} call${p.calls==1?'':'s'}</span></span>
      </div>`).join('') : '<div class="empty">No payers yet.</div>';

    const rows = set.settlements || [];
    document.getElementById('rows').innerHTML = rows.length ? rows.map(r => `
      <tr>
        <td class="mono">${new Date(r.created_at*1000).toLocaleTimeString()}</td>
        <td class="mono">${r.resource}</td>
        <td class="mono">${r.payer.slice(0,10)}…</td>
        <td class="num">${fmt(r.amount_usdc)}</td>
        <td><span class="tag ${r.status==='settled'?'ok':'no'}">${r.status}</span></td>
      </tr>`).join('') : '<tr><td colspan="5" class="empty">Nothing settled yet.</td></tr>';

    const rej = s.rejections || [];
    document.getElementById('rejsec').style.display = rej.length ? '' : 'none';
    document.getElementById('rejections').innerHTML = rej.map(r =>
      `<div class="top" style="margin-bottom:6px"><span class="mono">${r.code}</span><b>${r.count}</b></div>`
    ).join('');

    document.getElementById('dot').className = 'dot';
    document.getElementById('status').textContent = 'live';
  } catch (e) {
    document.getElementById('dot').className = 'dot stale';
    document.getElementById('status').textContent = 'offline';
  }
}
load();
setInterval(load, 3000);
</script>
</body>
</html>
"""

MANIFEST = """{
  "name": "x402 Profit",
  "short_name": "x402 Profit",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0b0f17",
  "theme_color": "#0b0f17",
  "icons": [
    {
      "src": "/icon.svg",
      "type": "image/svg+xml",
      "sizes": "any",
      "purpose": "any"
    }
  ]
}"""

ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="96" fill="#0b0f17"/>
<path d="M128 176 L256 112 L384 176 L256 240 Z" fill="#4da3ff"/>
<path d="M128 256 L256 320 L384 256" fill="none" stroke="#2ecc8f" stroke-width="22"
      stroke-linecap="round" stroke-linejoin="round"/>
<path d="M128 336 L256 400 L384 336" fill="none" stroke="#2ecc8f" stroke-width="22"
      stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>
</svg>"""


def register_dashboard(app, ledger: Ledger) -> None:
    """Mount the dashboard, manifest and icon on a FastAPI app."""
    from fastapi.responses import HTMLResponse, JSONResponse, Response

    @app.get("/dashboard", response_class=HTMLResponse, include_in_schema=False)
    @app.get("/", response_class=HTMLResponse, include_in_schema=False)
    def dashboard() -> str:
        return DASHBOARD_HTML

    @app.get("/manifest.webmanifest", include_in_schema=False)
    def manifest() -> JSONResponse:
        return JSONResponse(
            {
                "name": "x402 Profit",
                "short_name": "x402 Profit",
                "start_url": "/dashboard",
                "display": "standalone",
                "background_color": "#0b0f17",
                "theme_color": "#0b0f17",
                "icons": [{"src": "/icon.svg", "type": "image/svg+xml", "sizes": "any"}],
            }
        )

    @app.get("/icon.svg", include_in_schema=False)
    def icon() -> Response:
        return Response(
            ICON_SVG,
            media_type="image/svg+xml",
            headers={"Cache-Control": "public, max-age=86400"},
        )