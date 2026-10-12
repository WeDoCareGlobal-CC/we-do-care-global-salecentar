import React, { useState } from 'react';
import { Language, HermesImprovement } from '../types';
import { HERMES_IMPROVEMENTS, CONTENT_TOOL_STACK, CONTENT_PRICING_TIERS, CONTENT_PROMPTS, CONTENT_OUTREACH_SCRIPTS } from '../data/hermesData';
import { Bot, Copy, Check, Terminal, Sparkles, Layers, ShieldCheck, ArrowRight, Zap, Code, Send, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface HermesEngineViewProps {
  language: Language;
}

export const HermesEngineView: React.FC<HermesEngineViewProps> = ({ language }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedImprovementId, setExpandedImprovementId] = useState<string | null>('hermes_tool_calling');
  const [selectedPromptTab, setSelectedPromptTab] = useState<number>(0);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredImprovements = activeCategory === 'all'
    ? HERMES_IMPROVEMENTS
    : HERMES_IMPROVEMENTS.filter((item) => item.category === activeCategory);

  const categories = [
    { id: 'all', label: language === 'bs' ? 'Sve (10)' : 'All (10)' },
    { id: 'tool-calling', label: language === 'bs' ? 'Alati i Sheme' : 'Tool Calling' },
    { id: 'guardrails', label: language === 'bs' ? 'Pravila i Zaštita' : 'Guardrails' },
    { id: 'memory', label: language === 'bs' ? 'Memorija & Ton' : 'Voice Memory' },
    { id: 'architecture', label: language === 'bs' ? 'Arhitektura & Webhook' : 'Architecture' },
    { id: 'error-handling', label: language === 'bs' ? 'Pouzdanost & Limiti' : 'Reliability' },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Banner: Micro-niche & Hermes Autonomous Agent */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bot className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            {language === 'bs' ? 'HERMES AI AGENT SPECIFIKACIJA' : 'HERMES AI AGENT EXECUTION BLUEPRINT'}
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {language === 'bs'
              ? 'B2B Sadržajni Agent: Glasovne Poruke u 5 LinkedIn Objava i Newsletter'
              : 'B2B Content Multiplier Agent: Voice-to-5x LinkedIn & Newsletter Engine'}
          </h2>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {language === 'bs'
              ? 'Potpuni operativni nacrt za pokretanje agencije za sadržaj sa $0 uloga. Zauzeti osnivači vam pošalju 3-minutnu glasovnu poruku ili video, a vaš Hermes agent automatski kreira 5 vrhunskih LinkedIn objava, 1 sedmični newsletter i studiju slučaja. Ispod se nalazi 10 preciznih tehničkih unapređenja kako bi Hermes ovaj proces izvršavao autonomno.'
              : 'The definitive $0-investment micro-niche service blueprint. Busy founders send a 3-minute WhatsApp/Telegram voice memo or YouTube link, and your autonomous Hermes agent extracts the thesis, hooks, and drafts 5 viral LinkedIn posts plus an authority newsletter. Below are the 10 exact architectural improvements to execute this on autopilot.'}
          </p>

          {/* Quick Metrics Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Početni Ulog:' : 'Upfront Cost:'}</span>
              <span className="text-lg font-black text-emerald-400">$0.00</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Brzina do $100:' : 'Speed to $100:'}</span>
              <span className="text-lg font-black text-white">24 - 48h</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Prvi Pilot Paket:' : 'Initial Pilot Deal:'}</span>
              <span className="text-lg font-black text-white">$99 / deal</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
              <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Mjesečni Retainer:' : 'Monthly Retainer:'}</span>
              <span className="text-lg font-black text-emerald-400">$397 - $797/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE 1: $0 Tool Stack for Content Generation Service */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              {language === 'bs' ? 'Tabela Besplatnih Alata za Sadržajnu Agenciju ($0 Ulog)' : '$0 Free Tool Stack for Content Agency'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Svi alati rade unutar trajnih besplatnih paketa bez unosa kreditne kartice'
                : 'Operates entirely on permanent free tiers without credit card requirements'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">{language === 'bs' ? 'Alat' : 'Tool'}</th>
                <th className="py-3 px-4">{language === 'bs' ? 'Uloga u Sistemu' : 'Role in Pipeline'}</th>
                <th className="py-3 px-4">{language === 'bs' ? 'Cijena' : 'Cost'}</th>
                <th className="py-3 px-4">{language === 'bs' ? 'Besplatni Limit' : 'Free Tier Limit'}</th>
                <th className="py-3 px-4 text-right">{language === 'bs' ? 'Link' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {CONTENT_TOOL_STACK.map((tool, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {tool.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {language === 'bs' ? tool.role.bs : tool.role.en}
                  </td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">
                    {language === 'bs' ? tool.cost.bs : tool.cost.en}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {language === 'bs' ? tool.freeTierLimit.bs : tool.freeTierLimit.en}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline"
                    >
                      {language === 'bs' ? 'Otvori' : 'Visit'}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: Pricing Strategy & Packages */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            {language === 'bs' ? 'Cjenovnik i Ponuda: Put do Prvih $100 i Skaliranja' : 'Pricing & Offer Strategy: Path to $100 and Scaling'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'bs'
              ? 'Pilot paket od $99 uklanja svaki rizik za klijenta i osigurava prvu zaradu u 48 sati'
              : 'The $99 pilot package eliminates client skepticism and delivers your first profit in under 48 hours'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CONTENT_PRICING_TIERS.map((tier, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 ${
                idx === 0
                  ? 'bg-gradient-to-b from-emerald-950/40 to-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    {language === 'bs' ? tier.name.bs : tier.name.en}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {language === 'bs' ? 'NAJBRŽI DO $100' : 'FASTEST TO $100'}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${tier.price}</span>
                  <span className="text-xs text-slate-400">/ {language === 'bs' ? tier.billing.bs : tier.billing.en}</span>
                </div>

                <p className="text-[11px] text-emerald-400 font-semibold">{tier.targetVolume}</p>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    {language === 'bs' ? 'Isporuka:' : 'Deliverables:'}
                  </span>
                  <ul className="space-y-1.5">
                    {(language === 'bs' ? tier.deliverables.bs : tier.deliverables.en).map((item, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between items-center">
                <span>{language === 'bs' ? 'Vrijeme zatvaranja:' : 'Speed to close:'}</span>
                <span className="font-bold text-white">{language === 'bs' ? tier.speedToClose.bs : tier.speedToClose.en}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10 IMPROVEMENTS & ADJUSTMENTS FOR HERMES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-emerald-400" />
              {language === 'bs' ? '10 Tehničkih Unapređenja i Podešavanja za Hermes Agenta' : '10 Concrete Improvements & Adjustments for Hermes'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Arhitektura koja omogućava Hermes LLM-u autonomno izvršavanje preko Make.com i Airtable-a'
                : 'Architectural specifications enabling Hermes to autonomously run the entire content pipeline'}
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* List of 10 Improvements */}
        <div className="space-y-4">
          {filteredImprovements.map((item) => {
            const isExpanded = expandedImprovementId === item.id;
            return (
              <div
                key={item.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl transition overflow-hidden"
              >
                <div
                  onClick={() => setExpandedImprovementId(isExpanded ? null : item.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-xs shrink-0">
                      #{item.number}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        {language === 'bs' ? item.title.bs : item.title.en}
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {language === 'bs' ? item.summary.bs : item.summary.en}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      {isExpanded ? (language === 'bs' ? 'Sakrij' : 'Collapse') : (language === 'bs' ? 'Detalji' : 'Details')}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-900 space-y-4 bg-slate-950/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-3">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-400 font-bold block mb-1">
                          {language === 'bs' ? 'Arhitektonski Detalji:' : 'Architectural Specification:'}
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {language === 'bs' ? item.technicalDetail.bs : item.technicalDetail.en}
                        </p>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30">
                        <span className="text-emerald-400 font-bold block mb-1">
                          {language === 'bs' ? 'Uticaj na Profit & Skaliranje:' : 'Business & Scaling Impact:'}
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {language === 'bs' ? item.impact.bs : item.impact.en}
                        </p>
                      </div>
                    </div>

                    {/* Code or Schema Box */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span className="font-mono text-[11px]">
                          {language === 'bs' ? 'Kod / JSON Shema:' : 'Code / JSON Schema:'}
                        </span>
                        <button
                          onClick={() => handleCopy(item.codeOrSchema, item.id)}
                          className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded transition cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">{language === 'bs' ? 'Kopirano!' : 'Copied!'}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>{language === 'bs' ? 'Kopiraj Shemu' : 'Copy Schema'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-56 leading-relaxed">
                        {item.codeOrSchema}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Copy-Paste Master Content Prompts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              {language === 'bs' ? 'Tačni AI Promptovi za Sadržaj (Copy-Paste)' : 'Exact Content Prompts for ChatGPT / Gemini / Hermes'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Kopirajte ove promptove u Make.com ili direktno u besplatni ChatGPT/Bard za kreiranje isporuka'
                : 'Copy these prompts into Make.com AI nodes or ChatGPT/Bard for immediate client execution'}
            </p>
          </div>

          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {CONTENT_PROMPTS.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => setSelectedPromptTab(idx)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  selectedPromptTab === idx
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                #{idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Prompt Display */}
        {CONTENT_PROMPTS[selectedPromptTab] && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base">
                  {language === 'bs'
                    ? CONTENT_PROMPTS[selectedPromptTab].title.bs
                    : CONTENT_PROMPTS[selectedPromptTab].title.en}
                </h4>
                <p className="text-xs text-slate-400">
                  {language === 'bs'
                    ? CONTENT_PROMPTS[selectedPromptTab].purpose.bs
                    : CONTENT_PROMPTS[selectedPromptTab].purpose.en}
                </p>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    language === 'bs'
                      ? CONTENT_PROMPTS[selectedPromptTab].promptText.bs
                      : CONTENT_PROMPTS[selectedPromptTab].promptText.en,
                    CONTENT_PROMPTS[selectedPromptTab].id
                  )
                }
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                {copiedId === CONTENT_PROMPTS[selectedPromptTab].id ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>{language === 'bs' ? 'Kopirano!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>{language === 'bs' ? 'Kopiraj Prompt' : 'Copy Prompt'}</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {language === 'bs'
                ? CONTENT_PROMPTS[selectedPromptTab].promptText.bs
                : CONTENT_PROMPTS[selectedPromptTab].promptText.en}
            </pre>
          </div>
        )}
      </div>

      {/* Outreach Scripts for First 10 Customers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            {language === 'bs' ? 'Skripte za Prvih 10 Klijenata (Cold LinkedIn & Email)' : 'Outreach Scripts for First 10 Clients'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'bs'
              ? 'Pošaljite ovu skriptu 10 osnivača ili konsultanta danas. Ponuda besplatnog uzorka zatvara prvi ugovor za 24h.'
              : 'Send this to 10 founders or consultants today. The free sample hook converts skeptics within 24 hours.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONTENT_OUTREACH_SCRIPTS.map((s) => (
            <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {language === 'bs' ? s.channel.bs : s.channel.en}
                  </span>
                  <button
                    onClick={() => handleCopy(language === 'bs' ? s.body.bs : s.body.en, s.id)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded transition cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedId === s.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{language === 'bs' ? 'Kopirano!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === 'bs' ? 'Kopiraj' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white">
                  {language === 'bs' ? s.title.bs : s.title.en}
                </h4>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                  {language === 'bs' ? s.body.bs : s.body.en}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200">{language === 'bs' ? 'Taktika:' : 'Strategy tip:'} </strong>
                {language === 'bs' ? s.tips.bs : s.tips.en}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
