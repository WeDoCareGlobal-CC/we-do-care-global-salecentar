import React, { useState } from 'react';
import { Language } from '../types';
import { LANDING_PAGE_BLUEPRINT } from '../data/blueprintData';
import { Layout, Copy, Check, ShieldCheck, ArrowRight, Sparkles, CheckCircle } from 'lucide-react';

interface LandingPageCopyProps {
  language: Language;
}

export const LandingPageCopy: React.FC<LandingPageCopyProps> = ({ language }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const fullCopyText = `
${LANDING_PAGE_BLUEPRINT.headline[language]}

${LANDING_PAGE_BLUEPRINT.subheadline[language]}

CTA: ${LANDING_PAGE_BLUEPRINT.ctaText[language]}

--- PAIN POINTS ---
${LANDING_PAGE_BLUEPRINT.painPoints.map(p => `• ${p.title[language]}: ${p.desc[language]}`).join('\n')}

--- HOW IT WORKS ---
${LANDING_PAGE_BLUEPRINT.howItWorks.map(h => `${h.step}. ${h.title[language]} - ${h.desc[language]}`).join('\n')}
  `.trim();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                {language === 'bs' ? 'Kopija Landing Stranice (Gotovo Za Copy-Paste)' : 'Exact High-Converting Landing Page Copy'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'bs'
                  ? 'Iskoristite ovaj tekst na besplatnim sajtovima poput Carrd.co, Framer ili Google Sites'
                  : 'Ready to paste into free page builders like Carrd.co, Framer Free, or Notion'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCopy(fullCopyText, 'full_landing')}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
          >
            {copiedSection === 'full_landing' ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>{language === 'bs' ? 'Kopiran Čitav Tekst!' : 'Copied Entire Page!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{language === 'bs' ? 'Kopiraj Čitavu Stranicu' : 'Copy All Page Sections'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Live Preview Card Mockup */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Hero Section Mockup */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'bs' ? 'SISTEM ZA BRZI RAST LOKALNIH FIRMI' : 'ZERO-FRICTION LOCAL GROWTH ENGINE'}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {LANDING_PAGE_BLUEPRINT.headline[language]}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {LANDING_PAGE_BLUEPRINT.subheadline[language]}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => handleCopy(LANDING_PAGE_BLUEPRINT.ctaText[language], 'cta')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-sm transition shadow-xl shadow-emerald-500/20 cursor-pointer flex items-center gap-2"
            >
              <span>{LANDING_PAGE_BLUEPRINT.ctaText[language]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 flex items-center justify-center gap-2 pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            {language === 'bs' ? '100% Besplatna Analiza • Gotovo za 2 minute' : '100% Free Audit • Delivered in 2 Minutes'}
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            {language === 'bs' ? 'Zašto Lokalne Firme Gube Klijente Svaki Dan?' : 'Why Local Businesses Lose High-Value Clients Daily'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LANDING_PAGE_BLUEPRINT.painPoints.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {item.title[language]}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.desc[language]}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works 3 Steps */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            {language === 'bs' ? 'Kako Sistem Funkcioniše u 3 Koraka' : 'How The Automated System Works In 3 Simple Steps'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LANDING_PAGE_BLUEPRINT.howItWorks.map((step) => (
              <div key={step.step} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2 relative">
                <span className="text-2xl font-black text-emerald-500/30 absolute top-4 right-4">
                  {step.step}
                </span>
                <h4 className="text-sm font-bold text-white">
                  {step.title[language]}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {step.desc[language]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
