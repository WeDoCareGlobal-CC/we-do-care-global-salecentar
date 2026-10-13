import { useEffect, useState } from 'react';
import { centralApi, ApiError, type ModuleEntitlement, type SessionUser } from './lib/central-api';

export default function AppV2() {
  const [user,setUser]=useState<SessionUser|null>(null);
  const [loading,setLoading]=useState(true);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [modules,setModules]=useState<ModuleEntitlement[]>([]);
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{
    centralApi.session().then(r=>setUser(r.user)).catch(e=>{
      if (!(e instanceof ApiError && e.status===401)) setMessage('API trenutno nije dostupan.');
    }).finally(()=>setLoading(false));
  },[]);
  useEffect(()=>{
    if(!user){setModules([]);return;}
    centralApi.entitlements().then(r=>setModules(r.modules)).catch(()=>setMessage('Moduli trenutno nisu dostupni.'));
  },[user]);
  async function login(e: React.FormEvent) {
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
