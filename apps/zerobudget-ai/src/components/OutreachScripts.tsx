import React, { useState } from 'react';
import { Language } from '../types';
import { SCRIPTS } from '../data/blueprintData';
import { Send, Copy, Check, MessageSquare, Mail, Video, Clock, Sparkles } from 'lucide-react';

interface OutreachScriptsProps {
  language: Language;
}

export const OutreachScripts: React.FC<OutreachScriptsProps> = ({ language }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [inputs, setInputs] = useState({
    Owner_Name: 'Dr. Mehmedović',
    Business_Name: 'Sarajevo Dental Clinic',
    Niche: 'Stomatološke usluge',
    City: 'Sarajevo',
    Competitor_Name: 'Dental Care Pro',
    Your_Name: 'Haris',
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fillText = (text: string) => {
    let res = text;
    Object.entries(inputs).forEach(([k, v]) => {
      const re = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
      const replacement = String(v || `{{${k}}}`);
      res = res.replace(re, () => replacement);
    });
    return res;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {language === 'bs' ? 'Skripte Za Prvih 10 Klijenata (3-7 Dana do $100)' : 'Exact Outreach Scripts For Your First 10 Customers'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Testirane poruke sa visokom stopom odgovora. Bez spama, fokusirano na čistu vrijednost.'
                : 'High-converting, non-salesy outreach messages tested to get replies within 24-48 hours.'}
            </p>
          </div>
        </div>
      </div>

      {/* Input Variables customization */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {language === 'bs' ? 'Popunite Podatke Klijenata Za Instant Prilagođavanje:' : 'Fill Prospect Details for Live Instant Preview:'}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Ime Vlasnika</label>
            <input
              type="text"
              value={inputs.Owner_Name}
              onChange={(e) => setInputs({ ...inputs, Owner_Name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Firma Klijenta</label>
            <input
              type="text"
              value={inputs.Business_Name}
              onChange={(e) => setInputs({ ...inputs, Business_Name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Djelatnost</label>
            <input
              type="text"
              value={inputs.Niche}
              onChange={(e) => setInputs({ ...inputs, Niche: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Grad</label>
            <input
              type="text"
              value={inputs.City}
              onChange={(e) => setInputs({ ...inputs, City: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Konkurent</label>
            <input
              type="text"
              value={inputs.Competitor_Name}
              onChange={(e) => setInputs({ ...inputs, Competitor_Name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Vaše Ime</label>
            <input
              type="text"
              value={inputs.Your_Name}
              onChange={(e) => setInputs({ ...inputs, Your_Name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Scripts Grid */}
      <div className="space-y-6">
        {SCRIPTS.map((script) => {
          const filledBody = fillText(script.body[language]);
          const filledSubject = script.subject ? fillText(script.subject[language]) : null;

          return (
            <div
              key={script.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    {script.channel[language]}
                  </span>
                  <h3 className="text-lg font-extrabold text-white mt-1">
                    {script.title[language]}
                  </h3>
                </div>

                <button
                  onClick={() => handleCopy(filledSubject ? `Subject: ${filledSubject}\n\n${filledBody}` : filledBody, script.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'bs' ? 'Kopirano u Clipboard!' : 'Copied to Clipboard!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{language === 'bs' ? 'Kopiraj Poruku' : 'Copy Message'}</span>
                    </>
                  )}
                </button>
              </div>

              {filledSubject && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 font-bold block mb-0.5">Subject Line / Naslov Emaila:</span>
                  <span className="text-emerald-400 font-mono font-semibold">{filledSubject}</span>
                </div>
              )}

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                {filledBody}
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Savjet za slanje:</strong> {script.tips[language]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
