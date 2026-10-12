import {getCentralToken} from '../centralSession';
import React, { useState } from 'react';

export function PilotOrderIntake({ language }: { language: 'bs' | 'en' }) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/pilot-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${getCentralToken() || token}` },
        body: JSON.stringify({ customer_email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      setMessage(language === 'bs'
        ? `Narudžba ${data.order_id} je evidentirana kao NA ČEKANJU. Uplata nije potvrđena.`
        : `Order ${data.order_id} is PENDING. No payment has been verified.`);
      setEmail('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Request failed');
    } finally { setBusy(false); }
  };
  return <section className="rounded-2xl border border-emerald-500/30 bg-slate-900 p-6 space-y-3">
    <h2 className="text-xl font-bold">{language === 'bs' ? 'Pilot narudžbe — administracija' : 'Pilot orders — admin'}</h2>
    <p className="text-sm text-slate-400">{language === 'bs'
      ? 'Samo za ovlaštenog operatera. Ovaj obrazac evidentira zahtjev, ne naplaćuje kupca.'
      : 'Authorized operators only. This form records an order request; it does not charge a customer.'}</p>
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">Email kupca
        <input className="mt-1 w-full rounded bg-slate-800 p-2" type="email" required maxLength={254}
          value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className="block text-sm">Pilot pristupni token
        <input className="mt-1 w-full rounded bg-slate-800 p-2" type="password" autoComplete="off" required
          value={token} onChange={e => setToken(e.target.value)} />
      </label>
      <button disabled={busy} className="rounded bg-emerald-600 px-4 py-2 font-semibold disabled:opacity-50" type="submit">
        {busy ? '...' : (language === 'bs' ? 'Evidentiraj narudžbu' : 'Record pending order')}
      </button>
    </form>
    {message && <p role="status" className="text-sm break-words">{message}</p>}
  </section>;
}
