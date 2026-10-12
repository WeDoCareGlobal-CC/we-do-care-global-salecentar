import { useEffect, useState } from 'react';
import productCatalog from '../../../catalog/products.json';
import { api, auth } from '@appdeploy/client';
import {
  Activity, Bot, CreditCard, Download, Globe2, LayoutDashboard, LogOut,
  Menu, Search, ShieldCheck, Sparkles, Store, Wallet, Webhook, X
} from 'lucide-react';

const OWNER = 'emirperla96@gmail.com';
const products = productCatalog.products.map(p => ({
 id:p.id,title:p.name,category:'Integrated module',status:p.status,offerCode:p.offerCode
}));

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Command');
  const [q, setQ] = useState('');
  const [research, setResearch] = useState('');
  const [result, setResult] = useState('');
  const [webhooks, setWebhooks] = useState<string[]>([]);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const filtered = products.filter(p => !q || p.title.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    auth.getUser().then(u => setUser(u)).finally(() => setLoading(false));
  }, []);

  async function signIn() {
    try {
      const r = await auth.signIn({ scope: 'openid email profile' });
      if (r.user.email?.toLowerCase() === OWNER) setUser(r.user);
      else { await auth.signOut(); setNotice('This command center is private to the owner account.'); }
    } catch (e: any) {
      setNotice(e?.code === 'popup_blocked' ? 'Allow pop-ups to sign in with Google.' : 'Google sign-in was cancelled or failed.');
    }
  }

  async function signOut() { await auth.signOut(); setUser(null); }

  useEffect(() => {
    if (!user) return;
    api.get('/api/webhooks').then(r => setWebhooks((r.data.webhooks || []).map((x: any) => x.event))).catch(() => {});
  }, [user]);

  async function runResearch() {
    if (!research.trim()) return;
    const r = await api.post('/api/research', { query: research });
    setResult(r.data.message || JSON.stringify(r.data));
  }

  async function addWebhook() {
    const r = await api.post('/api/webhooks', { name: 'Price Changed', event: 'price.changed' });
    setWebhooks((r.data.webhooks || []).map((x: any) => x.event));
  }

  async function exportJson() {
    const r = await api.get('/api/export?format=json');
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sale-centar-export.json'; a.click();
  }

  const nav = [
    ['Command', LayoutDashboard], ['Sale Store', Store], ['Intelligence', Globe2],
    ['Automation', Webhook], ['Analytics', Activity], ['Wallet', Wallet], ['Migration', Download]
  ] as const;

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#061715] text-white/70">Loading secure command center…</div>;

  if (!user) return (
    <div className="min-h-screen bg-[#061715] text-[#f7f1e7] grid place-items-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a211e] p-8 shadow-2xl">
        <div className="text-xs uppercase tracking-[.3em] text-[#e59b78]">We Do Care</div>
        <h1 className="mt-2 text-4xl font-black">SaleCentar</h1>
        <p className="mt-3 text-white/50">Private commerce command center. Owner access only.</p>
        <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm">
          <ShieldCheck className="mb-2 text-emerald-300" size={20}/>
          <b>Protected account</b>
          <div className="mt-1 text-white/50">{OWNER}</div>
        </div>
        <button onClick={signIn} className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3 font-bold text-slate-900">
          <span className="text-lg">G</span> Sign in with Google
        </button>
        {notice && <div className="mt-4 rounded-xl bg-red-400/10 p-3 text-sm text-red-200">{notice}</div>}
      </div>
    </div>
  );

  if (user.email?.toLowerCase() !== OWNER) return <div className="min-h-screen grid place-items-center bg-[#061715] text-white">Access denied.</div>;

  return (
    <div className="min-h-screen bg-[#061715] text-[#f7f1e7]">
      <div className="flex min-h-screen">
        <aside className={'fixed z-20 h-full w-72 border-r border-white/10 bg-[#09211e] p-5 md:static ' + (menu ? 'block' : 'hidden md:block')}>
          <div className="flex items-center justify-between">
            <div><div className="text-xs uppercase tracking-[.25em] text-[#e59b78]">We Do Care</div><div className="text-2xl font-black">SaleCentar</div></div>
            <button className="md:hidden" onClick={() => setMenu(false)}><X/></button>
          </div>
          <div className="my-6 rounded-2xl border border-[#e59b78]/20 bg-[#e59b78]/10 p-4">
            <div className="flex gap-2 text-sm font-bold"><Sparkles size={16}/> Private AI commerce</div>
            <p className="mt-2 text-xs text-white/50">Hermes-ready storefront, intelligence and automation.</p>
          </div>
          <div className="space-y-1">{nav.map(([name, Icon]) => <button key={name} onClick={() => { setTab(name); setMenu(false); }} className={'flex w-full items-center gap-3 rounded-xl p-3 text-sm ' + (tab === name ? 'bg-[#e59b78] text-[#071a18] font-bold' : 'text-white/60')}><Icon size={17}/>{name}</button>)}</div>
          <div className="mt-8 rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-300"><ShieldCheck size={15}/> Owner verified</div>
            <div className="mt-2 truncate text-white/50">{user.email}</div>
          </div>
          <button onClick={signOut} className="mt-3 flex w-full items-center gap-3 rounded-xl p-3 text-sm text-white/50 hover:bg-white/5"><LogOut size={17}/> Sign out</button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-white/10 p-4 md:p-6">
            <button className="md:hidden" onClick={() => setMenu(true)}><Menu/></button>
            <span className="ml-3 text-sm text-white/40">We Do Care Global SaleCentar / {tab}</span>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs md:flex"><span className="h-2 w-2 rounded-full bg-emerald-300"/> Private</div>
          </header>

          <div className="mx-auto max-w-7xl p-5 md:p-8">
            <section className="mb-6 rounded-2xl border border-white/10 bg-[#0b2521] p-5" aria-label="We Do Care Global SaleCentar module registry">
              <h2 className="text-lg font-bold">We Do Care Global SaleCentar — moduli</h2>
              <p className="mt-1 text-xs text-white/50">Registar modula; status ne potvrđuje naplatu ni funkcionalnu integraciju.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {productCatalog.products.map((product) => (
                  <div key={product.id} className="rounded-xl border border-white/10 px-4 py-3">
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-white/50">{product.status}</div>
                  </div>
                ))}
              </div>
            </section>
            {tab === 'Command' && <div>
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#123a33] via-[#0b2521] to-[#081b19] p-7 md:p-10">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <div><div className="text-xs uppercase tracking-[.25em] text-[#e59b78]">Central commerce</div><h1 className="mt-3 text-4xl font-black leading-tight md:text-6xl">Discover products.<br/><span className="text-[#e59b78]">Automate commerce.</span></h1><p className="mt-5 max-w-2xl text-white/55">A private, agent-ready affiliate workspace for product discovery, content intelligence, automation and portable data.</p></div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm"><div className="text-white/40">Signed in as</div><div className="mt-1 font-bold">{user.name || OWNER}</div><div className="text-xs text-emerald-300">{OWNER}</div></div>
                </div>
                <div className="mt-7 flex flex-wrap gap-3"><button onClick={() => setTab('Sale Store')} className="rounded-xl bg-[#e59b78] px-5 py-3 font-bold text-[#071a18]">Open Sale Store</button><button onClick={() => setTab('Wallet')} className="rounded-xl border border-white/15 px-5 py-3">Open Wallet</button></div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-4">{[[String(productCatalog.products.length),'Modules registered'],['2','Source modules'],['Pilot','Integration stage'],['Owner','Access level']].map(x => <div key={x[1]} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><b className="text-3xl">{x[0]}</b><p className="mt-1 text-xs text-white/40">{x[1]}</p></div>)}</div>
            </div>}

            {tab === 'Sale Store' && <div><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="text-xs uppercase tracking-[.2em] text-[#e59b78]">Magazine storefront</div><h2 className="mt-2 text-4xl font-black">Sale Store</h2></div><div className="relative w-full md:w-72"><Search className="absolute left-3 top-3" size={16}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 pl-9 outline-none"/></div></div><div className="mt-6 grid gap-4 md:grid-cols-2">{filtered.map(p => <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><div className="text-xs text-[#e59b78]">{p.category}</div><div className="mt-4 text-xl font-bold">{p.title}</div><div className="mt-4 text-sm text-white/60">{p.status} · {p.offerCode}</div><div className="mt-5 text-xs text-amber-200/70">Pilot module · no public checkout configured</div></div>)}</div></div>}

            {tab === 'Intelligence' && <div><div className="text-xs uppercase tracking-[.2em] text-[#e59b78]">Live web intelligence</div><h2 className="mt-2 text-4xl font-black">Research before publishing</h2><p className="mt-3 text-white/50">Tavily-ready research layer. API keys remain backend-only.</p><div className="mt-6 rounded-2xl border border-white/10 p-5"><div className="flex flex-col gap-3 md:flex-row"><input value={research} onChange={e => setResearch(e.target.value)} placeholder="Best AI tools for remote teams" className="flex-1 rounded-xl bg-white/5 p-3"/><button onClick={runResearch} className="rounded-xl bg-[#e59b78] px-5 font-bold text-[#071a18]">Research</button></div>{result && <div className="mt-4 rounded-xl bg-black/20 p-4 text-sm text-white/60">{result}</div>}</div></div>}

            {tab === 'Automation' && <div><div className="flex flex-wrap justify-between gap-4"><div><div className="text-xs uppercase tracking-[.2em] text-[#e59b78]">API + Webhooks</div><h2 className="mt-2 text-4xl font-black">Automation</h2></div><button onClick={addWebhook} className="rounded-xl bg-[#e59b78] px-4 py-3 font-bold text-[#071a18]">New webhook</button></div><div className="mt-6 space-y-3">{webhooks.map(x => <div key={x} className="rounded-xl border border-white/10 p-4">{x}<span className="float-right text-emerald-300">active</span></div>)}</div></div>}

            {tab === 'Analytics' && <div><div className="text-xs uppercase tracking-[.2em] text-[#e59b78]">Performance</div><h2 className="mt-2 text-4xl font-black">Analytics</h2><div className="mt-6 grid gap-4 md:grid-cols-4">{[['Not connected','Verified revenue'],['Not connected','Paid orders'],['Not connected','Conversion rate'],[String(productCatalog.products.length),'Registered modules']].map(x => <div key={x[1]} className="rounded-2xl border border-white/10 p-5"><b className="text-3xl">{x[0]}</b><p className="text-xs text-white/40">{x[1]}</p></div>)}</div></div>}

            {tab === 'Wallet' && <div><div className="text-xs uppercase tracking-[.2em] text-[#e59b78]">Owner wallet</div><h2 className="mt-2 text-4xl font-black">Wallet & Payout Settings</h2><div className="mt-6 grid gap-4 lg:grid-cols-3"><div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-[#123a33] to-[#081b19] p-7"><div className="text-sm text-white/45">Available balance (demo)</div><div className="mt-2 text-5xl font-black">Not connected</div><div className="mt-2 text-xs text-emerald-300">No verified payout ledger connected</div></div><div className="rounded-3xl border border-white/10 p-6"><div className="flex items-center gap-2 font-bold"><CreditCard size={18}/> Payout methods</div><button onClick={() => setNotice('Payment-provider connection is a configuration step and is not active in this demo wallet.')} className="mt-5 w-full rounded-xl border border-white/10 p-3 text-left hover:bg-white/5">Connect PayPal</button><button onClick={() => setNotice('Payment-provider connection is a configuration step and is not active in this demo wallet.')} className="mt-3 w-full rounded-xl border border-white/10 p-3 text-left hover:bg-white/5">Connect Stripe</button><button onClick={() => setNotice('Withdrawal routing is disabled in the demo wallet. No money is transferred.')} className="mt-3 w-full rounded-xl bg-[#e59b78] p-3 font-bold text-[#071a18]">Withdrawal options</button></div></div>{notice && <div className="mt-4 rounded-xl border border-[#e59b78]/20 bg-[#e59b78]/10 p-4 text-sm text-white/70">{notice}</div>}<div className="mt-5 rounded-2xl border border-amber-200/10 bg-amber-200/5 p-4 text-sm text-white/50">Demo wallet only: no live payment account linking, transfers, or withdrawals are performed by these controls.</div></div>}

            {tab === 'Migration' && <div><div className="text-xs uppercase tracking-[.2em] text-[#e59b78]">No vendor lock-in</div><h2 className="mt-2 text-4xl font-black">Migration</h2><p className="mt-3 text-white/50">Portable JSON export now; CSV, SQL and Markdown can use the same adapter architecture.</p><button onClick={exportJson} className="mt-6 rounded-xl bg-[#e59b78] px-5 py-3 font-bold text-[#071a18]">Export JSON</button></div>}
          </div>
        </main>
      </div>
    </div>
  );
}
export default App;