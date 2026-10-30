import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, AudioLines, BadgeCheck, Bot, ChevronRight, CircleHelp, Compass, FileCheck2, LayoutGrid, LockKeyhole, Menu, Mic2, ShieldCheck, Sparkles, WandSparkles, Workflow, X } from 'lucide-react';
import { centralApi, ApiError, type ModuleEntitlement, type SessionUser } from './lib/central-api';

const previewOnly = import.meta.env.VITE_SALECENTAR_PREVIEW_ONLY === '1';

const showcase = [
  { id: 'menu-snap', name: 'Menu Snap', tagline: 'Pametniji digitalni meni', description: 'Jednostavniji način da predstaviš ponudu.', icon: LayoutGrid, color: 'peach', tag: 'Ugostiteljstvo' },
  { id: 'zerobudget-ai', name: 'ZeroBudget AI', tagline: 'Više uradi uz AI', description: 'Praktični AI alati za svaki radni dan.', icon: Bot, color: 'mint', tag: 'Produktivnost' },
  { id: 'muse-flow', name: 'Muse Flow', tagline: 'Ideje koje dobijaju oblik', description: 'Kreativni workflow na jednom mjestu.', icon: WandSparkles, color: 'lavender', tag: 'Kreativnost' },
  { id: 'hermes-x402', name: 'Hermes x402', tagline: 'Automatizacija sa kontrolom', description: 'Istraži povezane automatizirane procese.', icon: Workflow, color: 'sky', tag: 'Automatizacija' },
  { id: 'speech-generator', name: 'Speech Generator', tagline: 'Tekst pretvori u govor', description: 'Glasovni sadržaj uz jednostavan proces.', icon: Mic2, color: 'sand', tag: 'Audio' },
] as const;

const steps = [
  { number: '01', title: 'Upoznaj rješenja', detail: 'Istraži šta svaki alat može ponuditi.', status: 'Dostupno u pregledu' },
  { number: '02', title: 'Sigurno povezivanje', detail: 'Prijava i pristup bit će dostupni nakon testiranja.', status: 'U pripremi' },
  { number: '03', title: 'Aktivacija usluga', detail: 'Kupovina i licence ostaju isključene dok se integracije ne potvrde.', status: 'Nije aktivno' },
] as const;

function BrandMark() {
  return <div className="sc-brandmark" aria-hidden="true"><span>S</span><i /></div>;
}
function PreviewDashboard() {
  const [category, setCategory] = useState('Sve');
  const [mobileOpen, setMobileOpen] = useState(false);
  const categories = ['Sve', 'AI alati', 'Kreativnost', 'Poslovanje'];
  const visible = showcase.filter(p => category === 'Sve' || (category === 'AI alati' ? ['zerobudget-ai', 'speech-generator'].includes(p.id) : category === 'Kreativnost' ? p.id === 'muse-flow' : ['menu-snap','hermes-x402'].includes(p.id)));
  const close = () => setMobileOpen(false);
  return <main className="sc-shell sc-preview">
    <aside className={`sc-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="Glavna navigacija">
      <div className="sc-side-top">
        <a href="#pocetna" className="sc-brand" onClick={close}><BrandMark/><span><strong>SaleCentar</strong><small>by We Do Care Global</small></span></a>
        <button type="button" className="sc-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Zatvori meni"><X size={20}/></button>
      </div>
      <div className="sc-nav-label">RADNI PROSTOR</div>
      <nav className="sc-nav">
        <a href="#pocetna" onClick={close} className="sc-nav-active"><Compass size={18}/> Pregled</a>
        <a href="#rjesenja" onClick={close}><LayoutGrid size={18}/> Rješenja <span className="sc-count">05</span></a>
        <a href="#koraci" onClick={close}><FileCheck2 size={18}/> Sljedeći koraci</a>
      </nav>
      <div className="sc-nav-label sc-nav-second">PODRŠKA</div>
      <nav className="sc-nav"><a href="#informacije" onClick={close}><CircleHelp size={18}/> Informacije</a></nav>
      <div className="sc-sidebar-bottom">
        <div className="sc-side-note"><div className="sc-side-note-icon"><ShieldCheck size={19}/></div><strong>Sigurnost na prvom mjestu</strong><p>Ovaj pregled ne koristi naplatu, korisničke naloge ni Shopify povezivanje.</p></div>
        <div className="sc-side-footer"><span className="sc-online-dot"/> Staging pregled <span>v2.0</span></div>
      </div>
    </aside>
    {mobileOpen && <button type="button" aria-label="Zatvori navigaciju" className="sc-overlay" onClick={close} />}
    <div className="sc-content" id="pocetna">
      <header className="sc-topbar">
        <div className="sc-top-left"><button type="button" className="sc-menu-button" onClick={()=>setMobileOpen(true)} aria-label="Otvori meni"><Menu size={21}/></button><span>Radni prostor <ChevronRight size={14}/> <strong>Pregled</strong></span></div>
        <div className="sc-top-right"><span className="sc-live-badge"><span className="sc-live-dot"/> Pregled bez naplate</span><span className="sc-avatar">SC</span></div>
      </header>
      <div className="sc-main">
        <div className="sc-greeting"><span className="sc-eyebrow"><Sparkles size={14}/> DOBRO DOŠLI U SALECENTAR</span><h1>Jedno mjesto za <em>pametniji rad.</em></h1><p>Otkrij digitalne alate koji pojednostavljuju svakodnevne zadatke. Sve pregledno, bez komplikacija.</p></div>
        <section className="sc-hero" aria-label="Uvod u SaleCentar">
          <div className="sc-hero-copy"><span className="sc-hero-label"><span/> TVOJ DIGITALNI RADNI PROSTOR</span><h2>Manje koraka.<br/><span>Više mogućnosti.</span></h2><p>Od kreativnih ideja do pametne automatizacije — istraži alate prilagođene tvom načinu rada.</p><a href="#rjesenja" className="sc-primary-cta">Istraži rješenja <ArrowRight size={18}/></a><div className="sc-hero-foot"><ShieldCheck size={16}/> Siguran, informativni prikaz</div></div>
          <div className="sc-hero-visual" aria-hidden="true"><div className="sc-orbit sc-orbit-a"/><div className="sc-orbit sc-orbit-b"/><div className="sc-visual-glow"/><div className="sc-visual-main"><Sparkles size={44} strokeWidth={1.55}/></div><div className="sc-float sc-float-a"><Bot size={23}/></div><div className="sc-float sc-float-b"><AudioLines size={22}/></div><div className="sc-float sc-float-c"><Workflow size={21}/></div><span className="sc-visual-caption">Everything in one place.</span></div>
        </section>
        <div className="sc-highlights">
          <div><span className="sc-highlight-icon icon-mint"><LayoutGrid size={20}/></span><span><strong>5 rješenja</strong><small>Za različite potrebe</small></span></div>
          <div><span className="sc-highlight-icon icon-peach"><Sparkles size={20}/></span><span><strong>Jednostavno iskustvo</strong><small>Bez nepotrebnih koraka</small></span></div>
          <div><span className="sc-highlight-icon icon-lavender"><LockKeyhole size={20}/></span><span><strong>Bez obaveza</strong><small>Samo pregled mogućnosti</small></span></div>
        </div>
        <section id="rjesenja" className="sc-section">
          <div className="sc-section-header"><div><span className="sc-section-kicker">ISTRAŽI MOGUĆNOSTI</span><h2>Rješenja za tvoje ideje</h2><p>Odaberi ono što ti je trenutno najkorisnije.</p></div><span className="sc-section-count">Katalog mogućnosti · 5</span></div>
          <div className="sc-filters" role="group" aria-label="Filtriraj rješenja">{categories.map(c=><button type="button" key={c} aria-pressed={category===c} className={category===c?'selected':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
          <div className="sc-products">{visible.map(p=>{const Icon=p.icon;return <article key={p.id} className="sc-product"><div className={`sc-product-art art-${p.color}`}><span className="sc-product-glyph"><Icon size={34} strokeWidth={1.7}/></span><span className="sc-art-orb"/></div><div className="sc-product-info"><span className="sc-product-tag">{p.tag}</span><h3>{p.name}</h3><strong>{p.tagline}</strong><p>{p.description}</p><span className="sc-product-bottom"><span><span className="sc-mini-dot"/> U pripremi</span><span className="sc-arrow-icon" aria-label="Informativni pregled"><ArrowUpRight size={19}/></span></span></div></article>})}</div>
          <p className="sc-catalog-note"><ShieldCheck size={16}/> Ovo su informativne kartice rješenja, ne aktivni proizvodi za kupovinu. Cijene i dostupnost nisu prikazani.</p>
        </section>
        <section className="sc-next-section" id="koraci"><div className="sc-section-header"><div><span className="sc-section-kicker">ŠTA SLIJEDI?</span><h2>Jednostavno, korak po korak</h2><p>Znaš gdje smo danas i šta dolazi sljedeće.</p></div></div><div className="sc-steps">{steps.map(s=><article className="sc-step" key={s.number}><span className="sc-step-no">{s.number}</span><div><h3>{s.title}</h3><p>{s.detail}</p><span className="sc-step-status">{s.status}</span></div><ChevronRight size={18}/></article>)}</div></section>
        <section id="informacije" className="sc-disclaimer"><div className="sc-disclaimer-icon"><LockKeyhole size={22}/></div><div><strong>Pregledna verzija · bez aktivne trgovine</strong><p>Prijava, kupovine, Shopify webhookovi i isporuka licenci nisu aktivni. Ne unosite lozinke ni podatke za plaćanje. Ovaj pregled nije povezan s originalnom Shopify prodavnicom.</p></div></section>
        <footer className="sc-footer"><span>© SaleCentar · We Do Care Global</span><span>Napravljen da bude jednostavan. <BadgeCheck size={15}/></span></footer>
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
      if (!(e instanceof ApiError && e.status===401)) setMessage('API trenutno nije dostupan.');
    }).finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{
    if(!user){setModules([]);return;}
    centralApi.entitlements().then(r=>setModules(r.modules)).catch(()=>setMessage('Moduli trenutno nisu dostupni.'));
  },[user]);
  async function login(e: FormEvent) {
    e.preventDefault();setBusy(true);setMessage('');
    try { const r=await centralApi.login(email,password);setUser(r.user);setPassword(''); }
    catch { setMessage('Prijava nije uspjela. Provjerite podatke.'); }
    finally {setBusy(false);}
  }
  async function logout(){
    setBusy(true);setMessage('');
    try {await centralApi.logout();setUser(null);}
    catch {setMessage('Odjava nije uspjela.');}
    finally {setBusy(false);}
  }
  if (previewOnly) return <main className="sc-preview-root"><PreviewDashboard/></main>;
  return <main className="min-h-screen bg-[#061715] text-[#f7f1e7]">
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div><p className="text-xs uppercase tracking-[.25em] text-[#e59b78]">We Do Care Global</p><h1 className="text-3xl font-bold">SaleCentar 2.0</h1></div>
        {user&&<button disabled={busy} onClick={logout} className="rounded-xl border border-white/20 px-5 py-2">Odjava</button>}
      </header>
      {loading ? <p className="py-16">Provjera sesije…</p> : !user ?
        <form onSubmit={login} className="mx-auto mt-16 max-w-md space-y-5 rounded-3xl border border-white/10 bg-[#0b2521] p-8">
          <h2 className="text-2xl font-semibold">Sigurna prijava</h2>
          <p className="text-sm text-white/60">Nezavisna prijava preko SaleCentar centralnog API-ja.</p>
          <label className="block text-sm">Email<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 p-3"/></label>
          <label className="block text-sm">Lozinka<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl bg-white/10 p-3"/></label>
          <button disabled={busy} className="w-full rounded-xl bg-[#e59b78] p-3 font-semibold text-[#061715]">{busy?'Prijava…':'Prijavi se'}</button>
        </form> :
        <section className="py-10">
          <p className="text-white/60">Prijavljeni ste kao {user.email} · {user.role}</p>
          <h2 className="mt-8 text-2xl font-semibold">Moduli</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{modules.map(m=><article key={m.module_id} className="rounded-2xl border border-white/10 bg-[#0b2521] p-6">
            <h3 className="text-xl font-semibold">{m.name}</h3><p className="mt-2 text-sm text-white/50">{m.status}</p>
            <p className="mt-5 text-sm">{m.enabled?'Pristup odobren':'Pristup nije odobren'}</p>
          </article>)}</div>
          <p className="mt-8 text-sm text-white/50">Pilot prikaz. Pristup modulima ne potvrđuje aktivnu pretplatu, plaćanje niti live integraciju.</p>
        </section>}
      {message&&<p role="alert" className="mt-6 rounded-xl border border-amber-300/30 p-4 text-amber-200">{message}</p>}
    </div>
  </main>;
}
