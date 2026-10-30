import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, AudioLines, BadgeCheck, Bot, ChevronRight, CircleHelp, Compass, FileCheck2, LayoutGrid, LockKeyhole, Menu, Mic2, Search, ShieldCheck, Sparkles, WandSparkles, Workflow, X } from 'lucide-react';
import { centralApi, ApiError, type ModuleEntitlement, type SessionUser } from './lib/central-api';

const previewOnly = import.meta.env.VITE_SALECENTAR_PREVIEW_ONLY === '1';

const showcase = [
  { id: 'menu-snap', name: 'Menu Snap', tagline: 'A smarter digital menu', description: 'A simple way to showcase your offerings.', icon: LayoutGrid, color: 'peach', tag: 'Hospitality' },
  { id: 'zerobudget-ai', name: 'ZeroBudget AI', tagline: 'Get more done with AI', description: 'Practical AI tools for everyday work.', icon: Bot, color: 'mint', tag: 'Productivity' },
  { id: 'muse-flow', name: 'Muse Flow', tagline: 'Turn ideas into reality', description: 'A creative workflow in one place.', icon: WandSparkles, color: 'lavender', tag: 'Creative' },
  { id: 'hermes-x402', name: 'Hermes x402', tagline: 'Automation with control', description: 'Explore connected automated workflows.', icon: Workflow, color: 'sky', tag: 'Automation' },
  { id: 'speech-generator', name: 'Speech Generator', tagline: 'Turn text into speech', description: 'Create voice content with a simple workflow.', icon: Mic2, color: 'sand', tag: 'Audio' },
] as const;

const steps = [
  { number: '01', title: 'Explore solutions', detail: 'Discover what each tool can offer.', status: 'Available to explore' },
  { number: '02', title: 'Secure access', detail: 'Sign-in and access will follow security testing.', status: 'Coming soon' },
  { number: '03', title: 'Service activation', detail: 'Purchases and licenses remain disabled until integrations are verified.', status: 'Not active' },
] as const;

function BrandMark() {
  return <div className="sc-brandmark" aria-hidden="true"><span>S</span><i /></div>;
}
function PreviewDashboard() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const categories = ['All', 'AI Tools', 'Creative', 'Business'];
  const visible = showcase.filter(p => {
    const matchesCategory = category === 'All' || (category === 'AI Tools' ? ['zerobudget-ai', 'speech-generator'].includes(p.id) : category === 'Creative' ? p.id === 'muse-flow' : ['menu-snap','hermes-x402'].includes(p.id));
    const searchText = [p.name, p.tagline, p.description, p.tag].join(' ').toLocaleLowerCase('en');
    return matchesCategory && searchText.includes(query.trim().toLocaleLowerCase('en'));
  });
  const close = () => setMobileOpen(false);
  return <main className="sc-shell sc-preview">
    <aside className={`sc-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Main navigation">
      <div className="sc-side-top">
        <a href="#home" className="sc-brand" onClick={close}><BrandMark/><span><strong>SaleCentar</strong><small>by We Do Care Global</small></span></a>
        <button type="button" className="sc-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20}/></button>
      </div>
      <div className="sc-nav-label">WORKSPACE</div>
      <nav className="sc-nav">
        <a href="#home" onClick={close} className="sc-nav-active"><Compass size={18}/> Overview</a>
        <a href="#solutions" onClick={close}><LayoutGrid size={18}/> Solutions <span className="sc-count">05</span></a>
        <a href="#next-steps" onClick={close}><FileCheck2 size={18}/> Next steps</a>
      </nav>
      <div className="sc-nav-label sc-nav-second">SUPPORT</div>
      <nav className="sc-nav"><a href="#information" onClick={close}><CircleHelp size={18}/> Information</a></nav>
      <div className="sc-sidebar-bottom">
        <div className="sc-side-note"><div className="sc-side-note-icon"><ShieldCheck size={19}/></div><strong>Security first</strong><p>This preview has no payments, user accounts, or Shopify connection.</p></div>
        <div className="sc-side-footer"><span className="sc-online-dot"/> Staging preview <span>v2.0</span></div>
      </div>
    </aside>
    {mobileOpen && <button type="button" aria-label="Close navigation" className="sc-overlay" onClick={close} />}
    <div className="sc-content" id="home">
      <header className="sc-topbar">
        <div className="sc-top-left"><button type="button" className="sc-menu-button" onClick={()=>setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><span>Workspace <ChevronRight size={14}/> <strong>Overview</strong></span></div>
        <div className="sc-top-right"><span className="sc-live-badge"><span className="sc-live-dot"/> Preview only · No payments</span><span className="sc-avatar">SC</span></div>
      </header>
      <div className="sc-main">
        <div className="sc-greeting"><span className="sc-eyebrow"><Sparkles size={14}/> WELCOME TO SALECENTAR</span><h1>One place for <em>smarter work.</em></h1><p>Discover digital tools designed to simplify everyday tasks. Everything you need, without the complexity.</p></div>
        <section className="sc-hero" aria-label="Introduction to SaleCentar">
          <div className="sc-hero-copy"><span className="sc-hero-label"><span/> YOUR DIGITAL WORKSPACE</span><h2>Less busywork.<br/><span>More possibilities.</span></h2><p>From creative ideas to smart automation, explore tools designed for the way you work.</p><a href="#solutions" className="sc-primary-cta">Explore solutions <ArrowRight size={18}/></a><div className="sc-hero-foot"><ShieldCheck size={16}/> Safe, informational preview</div></div>
          <div className="sc-hero-visual" aria-hidden="true"><div className="sc-orbit sc-orbit-a"/><div className="sc-orbit sc-orbit-b"/><div className="sc-visual-glow"/><div className="sc-visual-main"><Sparkles size={44} strokeWidth={1.55}/></div><div className="sc-float sc-float-a"><Bot size={23}/></div><div className="sc-float sc-float-b"><AudioLines size={22}/></div><div className="sc-float sc-float-c"><Workflow size={21}/></div><span className="sc-visual-caption">Everything in one place.</span></div>
        </section>
        <div className="sc-highlights">
          <div><span className="sc-highlight-icon icon-mint"><LayoutGrid size={20}/></span><span><strong>5 solutions</strong><small>For different needs</small></span></div>
          <div><span className="sc-highlight-icon icon-peach"><Sparkles size={20}/></span><span><strong>Easy to use</strong><small>Without extra steps</small></span></div>
          <div><span className="sc-highlight-icon icon-lavender"><LockKeyhole size={20}/></span><span><strong>No commitment</strong><small>Explore at your own pace</small></span></div>
        </div>
        <section id="solutions" className="sc-section">
          <div className="sc-section-header"><div><span className="sc-section-kicker">DISCOVER WHAT'S POSSIBLE</span><h2>Solutions for your ideas</h2><p>Find the tools that fit your needs.</p></div><span className="sc-section-count">Explore 5 solutions</span></div>
          <div className="sc-discovery-tools"><label className="sc-search"><Search size={18} aria-hidden="true"/><span className="sr-only">Search solutions</span><input type="search" placeholder="Search solutions..." autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} /></label><div className="sc-filters" role="group" aria-label="Filter solutions">{categories.map(c=><button type="button" key={c} aria-pressed={category===c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
          <div className="sc-products">{visible.map(p=>{const Icon=p.icon;return <article key={p.id} className="sc-product"><div className={`sc-product-art art-${p.color}`}><span className="sc-product-glyph"><Icon size={34} strokeWidth={1.7}/></span><span className="sc-art-orb"/></div><div className="sc-product-info"><span className="sc-product-tag">{p.tag}</span><h3>{p.name}</h3><strong>{p.tagline}</strong><p>{p.description}</p><span className="sc-product-bottom"><span><span className="sc-mini-dot"/> Coming soon</span><span className="sc-arrow-icon" aria-label="Informational preview"><ArrowUpRight size={19}/></span></span></div></article>})}</div>
          {visible.length === 0 && <div className="sc-empty" role="status"><Search size={25}/><strong>No matching solutions</strong><p>Try another search term or explore all categories.</p><button type="button" onClick={()=>{setQuery('');setCategory('All');}}>Clear filters</button></div>}
          <p className="sc-catalog-note"><ShieldCheck size={16}/> These are informational solution cards, not products available for purchase. Prices and availability are not displayed.</p>
        </section>
        <section className="sc-next-section" id="next-steps"><div className="sc-section-header"><div><span className="sc-section-kicker">WHAT'S NEXT?</span><h2>Simple steps, clear progress</h2><p>See what's available now and what's coming next.</p></div></div><div className="sc-steps">{steps.map(s=><article className="sc-step" key={s.number}><span className="sc-step-no">{s.number}</span><div><h3>{s.title}</h3><p>{s.detail}</p><span className="sc-step-status">{s.status}</span></div><ChevronRight size={18}/></article>)}</div></section>
        <section id="information" className="sc-disclaimer"><div className="sc-disclaimer-icon"><LockKeyhole size={22}/></div><div><strong>Preview mode · No active storefront</strong><p>Sign-in, purchases, Shopify webhooks, and license delivery are disabled. Do not enter passwords or payment information. This preview is not connected to the original Shopify store.</p></div></section>
        <footer className="sc-footer"><span>© SaleCentar · We Do Care Global</span><span>Designed to feel effortless. <BadgeCheck size={15}/></span></footer>
      </div>
    </div>
  </main>;
}

export default function AppV2() {
  const [user,setUser]=useState<SessionUser|null>(null);
  const [loading,setLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [modules,setModules]=useState<ModuleEntitlement[]>([]);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    if (previewOnly) { setLoading(false); return; }
    centralApi.session().then(r=>setUser(r.user)).catch(e=>{
      if (!(e instanceof ApiError && e.status===401)) setMessage('The API is currently unavailable.');
    }).finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{
    if(!user){setModules([]);return;}
    centralApi.entitlements().then(r=>setModules(r.modules)).catch(()=>setMessage('Modules are currently unavailable.'));
  },[user]);
  async function login(e: FormEvent) {
    e.preventDefault();setBusy(true);setMessage('');
    try { const r=await centralApi.login(email,password);setUser(r.user);setPassword(''); }
    catch { setMessage('Sign-in failed. Check your details.'); }
    finally {setBusy(false);}
  }
  async function logout(){
    setBusy(true);setMessage('');
    try {await centralApi.logout();setUser(null);}
    catch {setMessage('Sign-out failed.');}
    finally {setBusy(false);}
  }
  if (previewOnly) return <main className="sc-preview-root"><PreviewDashboard/></main>;
  return <main className="min-h-screen bg-[#061715] text-[#f7f1e7]">
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div><p className="text-xs uppercase tracking-[.25em] text-[#e59b78]">We Do Care Global</p><h1 className="text-3xl font-bold">SaleCentar 2.0</h1></div>
        {user&&<button disabled={busy} onClick={logout} className="rounded-xl border border-white/20 px-5 py-2">Sign out</button>}
      </header>
      {loading ? <p className="py-16">Checking session…</p> : !user ?
        <form onSubmit={login} className="mx-auto mt-16 max-w-md space-y-5 rounded-3xl border border-white/10 bg-[#0b2521] p-8">
          <h2 className="text-2xl font-semibold">Secure sign-in</h2>
          <p className="text-sm text-white/60">Sign in through the independent SaleCentar central API.</p>
          <label className="block text-sm">Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 p-3"/></label>
          <label className="block text-sm">Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 p-3"/></label>
          <button disabled={busy} className="w-full rounded-xl bg-[#e59b78] p-3 font-semibold text-[#061715]">{busy?'Signing in…':'Sign in'}</button>
        </form> :
        <section className="py-10">
          <p className="text-white/60">Signed in as {user.email} · {user.role}</p>
          <h2 className="mt-8 text-2xl font-semibold">Modules</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{modules.map(m=><article key={m.module_id} className="rounded-2xl border border-white/10 bg-[#0b2521] p-6">
            <h3 className="text-xl font-semibold">{m.name}</h3><p className="mt-2 text-sm text-white/50">{m.status}</p>
            <p className="mt-5 text-sm">{m.enabled?'Access granted':'Access not granted'}</p>
          </article>)}</div>
          <p className="mt-8 text-sm text-white/50">Pilot view. Module access does not confirm an active subscription, payment, or live integration.</p>
        </section>}
      {message&&<p role="alert" className="mt-6 rounded-xl border border-amber-300/30 p-4 text-amber-200">{message}</p>}
    </div>
  </main>;
}
