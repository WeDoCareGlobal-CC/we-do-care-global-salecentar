import React, { useState } from 'react';
import { Language } from '../types';
import {
  AFFILIATE_COMPARISON,
  AFFILIATE_TIERS,
  AFFILIATE_TOOL_STACK,
  AFFILIATE_PROMPTS,
  AFFILIATE_LANDING_PAGE_COPY,
  AFFILIATE_OUTREACH_SCRIPTS,
  AFFILIATE_WORKFLOW_NODES,
  AFFILIATE_ASCII_DIAGRAM,
} from '../data/affiliateData';
import {
  Sparkles,
  Award,
  DollarSign,
  Zap,
  ShieldCheck,
  Cpu,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Sliders,
  CheckCircle2,
  Share2,
  FileText,
  Workflow,
  HelpCircle,
} from 'lucide-react';

interface AffiliateBlueprintViewProps {
  language: Language;
}

export const AffiliateBlueprintView: React.FC<AffiliateBlueprintViewProps> = ({ language }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Calculator State
  const [toolPrice, setToolPrice] = useState<number>(49);
  const [commissionPct, setCommissionPct] = useState<number>(35);
  const [monthlyReferrals, setMonthlyReferrals] = useState<number>(10);

  // Active prompt tester
  const [activePromptIndex, setActivePromptIndex] = useState<number>(0);
  const [customNiche, setCustomNiche] = useState<string>('AI Automation for Real Estate');
  const [customTool, setCustomTool] = useState<string>('Make.com');
  const [customCompetitor, setCustomCompetitor] = useState<string>('Zapier');

  // Outreach active script
  const [activeScriptIndex, setActiveScriptIndex] = useState<number>(0);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Monthly Recurring Commission per user
  const monthlyCommissionPerUser = (toolPrice * (commissionPct / 100));
  // Month 1 income (with 10 users)
  const month1MRR = Math.round(monthlyCommissionPerUser * monthlyReferrals);
  // Month 3 compounding (with ~5% churn)
  const month3MRR = Math.round(monthlyCommissionPerUser * monthlyReferrals * 2.8);
  // Month 6 compounding
  const month6MRR = Math.round(monthlyCommissionPerUser * monthlyReferrals * 5.2);
  // Referrals needed to hit $5,000/mo
  const referralsFor5k = Math.ceil(5000 / (monthlyCommissionPerUser || 1));

  // Current active prompt text with replaced variables
  const currentPrompt = AFFILIATE_PROMPTS[activePromptIndex];
  const renderedPromptText = currentPrompt.promptText[language]
    .replace(/\{\{Target_Niche\}\}/g, customNiche)
    .replace(/\{\{Recommended_Tool\}\}/g, customTool)
    .replace(/\{\{Competitor_Tool\}\}/g, customCompetitor)
    .replace(/\{\{Pain_Point\}\}/g, 'wasting 10 hours syncing leads manually')
    .replace(/\{\{Target_Audience\}\}/g, customNiche + ' professionals')
    .replace(/\{\{Free_Template_Name\}\}/g, customTool + ' Auto-Sync Blueprint');

  return (
    <div className="space-y-10">
      {/* 1. Header Banner & Executive Analysis */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-400" />
            {language === 'bs'
              ? 'PRIORITETNA STRATEGIJA: $0 ULOG & 100% PASIVNO SKALIRANJE'
              : 'PRIORITIZED STRATEGY: $0 CAPITAL & PASSIVE MRR AGENT'}
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              {AFFILIATE_COMPARISON.modelName[language]}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
              {AFFILIATE_COMPARISON.whyItWins[language]}
            </p>
          </div>

          {/* Key Metric Pillars */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">
                {language === 'bs' ? 'Početni Ulog' : 'Upfront Budget'}
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                $0.00 (100% Free Tools)
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">
                {language === 'bs' ? 'Brzina do Prvih $100' : 'Speed to First $100'}
              </span>
              <div className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                4 - 7 {language === 'bs' ? 'Dana' : 'Days'}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">
                {language === 'bs' ? 'Potencijal Skaliranja' : 'Scalability Potential'}
              </span>
              <div className="text-base sm:text-lg font-black text-indigo-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                $5,000+ / {language === 'bs' ? 'mjesečno' : 'month'}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400 font-medium">
                {language === 'bs' ? 'Upravljanje Klijentima' : 'Client Management'}
              </span>
              <div className="text-base sm:text-lg font-black text-teal-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {language === 'bs' ? 'NULA Sastanaka & Poziva' : 'ZERO Client Calls'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Commission & Pricing Calculator */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sliders className="w-4 h-4" />
              {language === 'bs' ? 'Interaktivna Matematika Zarade' : 'Commission & MRR Simulator'}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {language === 'bs'
                ? 'Kalkulator Ponavljajuće Provizije (Put do $5.000/mj)'
                : 'Recurring SaaS Affiliate Revenue Calculator (Path to $5k/mo)'}
            </h2>
          </div>
          <div className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            {language === 'bs' ? 'Bazirano na mjesečnim SaaS ugovorima' : 'Based on Monthly Recurring Revenue (MRR)'}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="space-y-5 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            {/* Slider 1: Software Plan Price */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-300">
                  {language === 'bs' ? 'Prosječna Cijena Softvera:' : 'Average Software Price:'}
                </span>
                <span className="text-emerald-400 font-mono font-bold">${toolPrice} / mo</span>
              </div>
              <input
                type="range"
                min="19"
                max="199"
                step="10"
                value={toolPrice}
                onChange={(e) => setToolPrice(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>$19 (Basic)</span>
                <span>$99 (Pro)</span>
                <span>$199 (Agency)</span>
              </div>
            </div>

            {/* Slider 2: Commission Percentage */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-300">
                  {language === 'bs' ? 'Stopa Provizije (%):' : 'Affiliate Commission Rate:'}
                </span>
                <span className="text-indigo-400 font-mono font-bold">{commissionPct}% Recurring</span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                step="5"
                value={commissionPct}
                onChange={(e) => setCommissionPct(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>20% (Standard)</span>
                <span>35% (Top SaaS)</span>
                <span>50% (High Partner)</span>
              </div>
            </div>

            {/* Slider 3: Monthly Referrals */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span className="text-slate-300">
                  {language === 'bs' ? 'Novih Pretplatnika Mjesečno:' : 'New Referrals Per Month:'}
                </span>
                <span className="text-teal-400 font-mono font-bold">{monthlyReferrals} users / mo</span>
              </div>
              <input
                type="range"
                min="3"
                max="40"
                step="1"
                value={monthlyReferrals}
                onChange={(e) => setMonthlyReferrals(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>3 (Part-time)</span>
                <span>10 (1-2 videos/wk)</span>
                <span>40 (Daily agent)</span>
              </div>
            </div>
          </div>

          {/* Results Visual Display */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400">
                  {language === 'bs' ? 'Zarada Po Korisniku Mjesečno' : 'Commission Per Active User / Mo'}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  ${monthlyCommissionPerUser.toFixed(2)}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ mo recurring</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 pt-3 border-t border-slate-800/80 mt-4">
                {language === 'bs'
                  ? 'Svaki korisnik koji ostane aktivan donosi vam ovaj iznos svakog 1. u mjesecu.'
                  : 'Every active subscriber keeps paying you this every single month automatically.'}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/30 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <div>
                <span className="text-xs text-indigo-400 font-semibold">
                  {language === 'bs' ? 'Prvih 7 Dana (Cilj: $100)' : 'First 7 Days Target ($100 Goal)'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  ${Math.round(monthlyCommissionPerUser * Math.max(3, Math.round(monthlyReferrals / 3)))}
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({Math.max(3, Math.round(monthlyReferrals / 3))} {language === 'bs' ? 'korisnika' : 'signups'})
                  </span>
                </div>
              </div>
              <div className="text-xs text-emerald-400/90 pt-3 border-t border-slate-800 mt-4 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                {language === 'bs' ? 'Dostižno sa samo 3 konverzije!' : 'Achievable with just 3 conversions!'}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400">
                  {language === 'bs' ? 'Mjesec 1 Pasivni MRR' : 'Month 1 Recurring Revenue'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-indigo-300 mt-1">
                  ${month1MRR}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 pt-3 border-t border-slate-800/80 mt-4">
                {language === 'bs' ? 'Zarada na kraju prvih 30 dana rada' : 'Predictable income after first 30 days'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950 p-5 rounded-2xl border border-indigo-500/40 flex flex-col justify-between">
              <div>
                <span className="text-xs text-indigo-300 font-bold">
                  {language === 'bs' ? 'Mjesec 6 Kumulativni Pasivni MRR' : 'Month 6 Compounded MRR'}
                </span>
                <div className="text-2xl sm:text-3xl font-black text-teal-400 mt-1">
                  ${month6MRR}
                  <span className="text-xs font-normal text-slate-300 ml-1">/ month</span>
                </div>
              </div>
              <div className="text-xs text-slate-300 pt-3 border-t border-indigo-900/50 mt-4 flex items-center justify-between">
                <span>{language === 'bs' ? 'Potrebno za $5.000/mj:' : 'Referrals to hit $5k/mo:'}</span>
                <strong className="text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                  {referralsFor5k} {language === 'bs' ? 'korisnika' : 'users'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Tier Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {AFFILIATE_TIERS.map((tier, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{tier.category[language]}</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[11px]">
                  {tier.commissionRate[language]}
                </span>
              </div>
              <p className="text-slate-400">
                <strong className="text-slate-200">{language === 'bs' ? 'Prosjek po prodaji:' : 'Average Payout:'}</strong>{' '}
                {tier.avgPayoutPerSale[language]}
              </p>
              <div className="text-slate-400">
                <span className="text-slate-500 block mb-1">{language === 'bs' ? 'Primjeri alata:' : 'Example Programs:'}</span>
                <div className="flex flex-wrap gap-1">
                  {tier.examplePrograms.map((p, pIdx) => (
                    <span key={pIdx} className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-teal-400 text-[11px] pt-1">
                ⭐ {tier.bestFor[language]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Free $0 Tool Stack */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {language === 'bs' ? 'Alati Bez Troškova' : 'Zero-Cost Infrastructure'}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {language === 'bs'
                ? 'Besplatni $0 Stack: Make.com, Airtable, Gemini & Bridge Page'
                : '$0 Free Tool Stack: Make.com, Airtable, Gemini & Bridge Page'}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AFFILIATE_TOOL_STACK.map((tool, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 space-y-3 transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base group-hover:text-indigo-400 transition">
                    {tool.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                    {tool.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tool.role[language]}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{language === 'bs' ? 'Trošak:' : 'Cost:'}</span>
                  <span className="text-emerald-400 font-bold">{tool.cost[language]}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{language === 'bs' ? 'Besplatni limit:' : 'Free Limit:'}</span>
                  <span className="text-slate-300 font-medium text-[11px] text-right max-w-[180px]">
                    {tool.freeTierLimit[language]}
                  </span>
                </div>
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 w-full py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-800"
                >
                  <span>{language === 'bs' ? 'Otvori Alat' : 'Visit Platform'}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Master Copy-Paste Prompts with Interactive Parameter Injection */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Cpu className="w-4 h-4" />
              {language === 'bs' ? 'Tačni AI Promptovi' : 'Copy-Paste Prompt Engine'}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {language === 'bs'
                ? 'Master Promptovi za Pronalaženje, Pisanje i Skripte'
                : 'Exact Prompts for Program Discovery, Review Articles & Scripts'}
            </h2>
          </div>
          <div className="text-xs text-slate-400">
            {language === 'bs' ? '1-klik kopiranje prilagođenog teksta' : '1-click copy with dynamic variables'}
          </div>
        </div>

        {/* Dynamic Variable Customizers */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-300 block">
            {language === 'bs' ? 'Prilagodite Promjenjive za Vašu Nišu (Automatski se ubacuje u prompt):' : 'Customize Variables for Your Niche (Auto-injected into prompt):'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {language === 'bs' ? 'Ciljna Niša / Industrija:' : 'Target Niche / Industry:'}
              </label>
              <input
                type="text"
                value={customNiche}
                onChange={(e) => setCustomNiche(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {language === 'bs' ? 'Preporučeni Softver (Affiliate):' : 'Recommended Software (Affiliate):'}
              </label>
              <input
                type="text"
                value={customTool}
                onChange={(e) => setCustomTool(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {language === 'bs' ? 'Skupa Alternativa / Konkurent:' : 'Expensive Competitor / Alternative:'}
              </label>
              <input
                type="text"
                value={customCompetitor}
                onChange={(e) => setCustomCompetitor(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Prompt Selector Tabs */}
        <div className="flex flex-wrap gap-2">
          {AFFILIATE_PROMPTS.map((prompt, idx) => (
            <button
              key={prompt.id}
              onClick={() => setActivePromptIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activePromptIndex === idx
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>#{idx + 1}</span>
              <span className="truncate max-w-[200px]">{prompt.title[language]}</span>
            </button>
          ))}
        </div>

        {/* Prompt Display Box */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-white text-sm">
                {currentPrompt.title[language]}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'bs' ? 'Ciljni alat:' : 'Target engine:'}{' '}
                <span className="text-indigo-400 font-semibold">{currentPrompt.toolTarget}</span>
              </p>
            </div>

            <button
              onClick={() => handleCopy(currentPrompt.id, renderedPromptText)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                copiedId === currentPrompt.id
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40'
              }`}
            >
              {copiedId === currentPrompt.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === currentPrompt.id ? (language === 'bs' ? 'Kopirano!' : 'Copied!') : (language === 'bs' ? 'Kopiraj Ovaj Prompt' : 'Copy Prompt')}</span>
            </button>
          </div>

          <div className="p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[350px] overflow-y-auto selection:bg-indigo-500 selection:text-white">
            {renderedPromptText}
          </div>
        </div>
      </div>

      {/* 5. Compelling Landing Page / Bridge Page Copy */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <FileText className="w-4 h-4" />
              {language === 'bs' ? 'Konvertujuća Bridge Stranica' : 'High-Converting Bridge Page Copy'}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {language === 'bs'
                ? 'Kopija Stranice za Preuzimanje Šablona i Preusmjeravanje'
                : 'Exact Bridge Page Copy with Feature Matrix & FTC Compliance'}
            </h2>
          </div>
          <button
            onClick={() =>
              handleCopy(
                'bridge_copy_all',
                `HEADLINE: ${AFFILIATE_LANDING_PAGE_COPY.headline[language]}\n\nSUBHEADLINE: ${AFFILIATE_LANDING_PAGE_COPY.subheadline[language]}\n\nCTA: ${AFFILIATE_LANDING_PAGE_COPY.ctaPrimary[language]}\n\nFTC DISCLAIMER: ${AFFILIATE_LANDING_PAGE_COPY.ftcDisclaimer[language]}`
              )
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              copiedId === 'bridge_copy_all'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copiedId === 'bridge_copy_all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{language === 'bs' ? 'Kopiraj Cijeli Tekst Stranice' : 'Copy All Page Copy'}</span>
          </button>
        </div>

        {/* Bridge Page Visual Simulation Preview */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
              {language === 'bs' ? 'Besplatan AI Vodič i Gotov Šablon' : 'Free Automation Template & Setup Guide'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {AFFILIATE_LANDING_PAGE_COPY.headline[language]}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              {AFFILIATE_LANDING_PAGE_COPY.subheadline[language]}
            </p>
          </div>

          {/* Feature Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">{language === 'bs' ? 'Karakteristika' : 'Feature'}</th>
                  <th className="py-2.5 px-3 font-semibold text-rose-400">{language === 'bs' ? 'Tradicionalni / Ručni Način' : 'Old Manual Way'}</th>
                  <th className="py-2.5 px-3 font-semibold text-emerald-400">{language === 'bs' ? 'Preporučeni AI Sistem' : 'Recommended AI System'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {AFFILIATE_LANDING_PAGE_COPY.comparisonPoints.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-bold text-white">{row.feature[language]}</td>
                    <td className="py-2.5 px-3 text-slate-400">{row.traditional[language]}</td>
                    <td className="py-2.5 px-3 text-emerald-300 font-semibold">{row.recommended[language]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Call to action & button */}
          <div className="text-center pt-2 space-y-3">
            <button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer inline-flex items-center gap-2">
              <span>{AFFILIATE_LANDING_PAGE_COPY.ctaPrimary[language]}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-500 max-w-2xl mx-auto italic">
              {AFFILIATE_LANDING_PAGE_COPY.ftcDisclaimer[language]}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Outreach & Distribution Scripts for First 10 Customers */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Share2 className="w-4 h-4" />
              {language === 'bs' ? 'Distribucija Bez Oglasa' : 'Zero-Ad Distribution Scripts'}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {language === 'bs'
                ? 'Skripte za Prvih 10 Korisnika / Kupaca (Reddit, LinkedIn, Grupe)'
                : 'Exact Scripts for First 10 Conversions (Reddit, LinkedIn, Groups)'}
            </h2>
          </div>
        </div>

        {/* Script Selection Tabs */}
        <div className="flex flex-wrap gap-2">
          {AFFILIATE_OUTREACH_SCRIPTS.map((script, idx) => (
            <button
              key={script.id}
              onClick={() => setActiveScriptIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeScriptIndex === idx
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{script.channel[language]}</span>
            </button>
          ))}
        </div>

        {/* Active Script Details */}
        {(() => {
          const currentScript = AFFILIATE_OUTREACH_SCRIPTS[activeScriptIndex];
          return (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {currentScript.title[language]}
                  </h3>
                  <span className="text-[11px] text-indigo-400 font-mono">
                    {currentScript.channel[language]}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(currentScript.id, currentScript.body[language])}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    copiedId === currentScript.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40'
                  }`}
                >
                  {copiedId === currentScript.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === currentScript.id ? (language === 'bs' ? 'Kopirano!' : 'Copied!') : (language === 'bs' ? 'Kopiraj Skriptu' : 'Copy Script')}</span>
                </button>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                {currentScript.body[language]}
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <p>
                  <strong>{language === 'bs' ? 'Važan Savjet:' : 'Crucial Pro Tip:'}</strong>{' '}
                  {currentScript.tips[language]}
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 7. Text-Based Automation Workflow Diagram (ASCII + Step Nodes) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Workflow className="w-4 h-4" />
              {language === 'bs' ? 'Tekstualni & Vizuelni Dijagram' : 'Automation Workflow Architecture'}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              {language === 'bs'
                ? 'Make.com + Airtable + Gemini Tok Automatizacije'
                : 'Full Text-Based & Visual Automation Workflow Diagram'}
            </h2>
          </div>
          <button
            onClick={() => handleCopy('ascii_diagram_copy', AFFILIATE_ASCII_DIAGRAM)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              copiedId === 'ascii_diagram_copy'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copiedId === 'ascii_diagram_copy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{language === 'bs' ? 'Kopiraj ASCII Dijagram' : 'Copy ASCII Diagram'}</span>
          </button>
        </div>

        {/* ASCII Block */}
        <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 overflow-x-auto">
          <pre className="font-mono text-[11px] sm:text-xs text-indigo-300 leading-tight">
            {AFFILIATE_ASCII_DIAGRAM}
          </pre>
        </div>

        {/* 5 Sequential Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {AFFILIATE_WORKFLOW_NODES.map((node) => (
            <div
              key={node.step}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
                  {node.step}
                </div>
                <h4 className="font-bold text-white text-xs">{node.title[language]}</h4>
                <span className="text-[10px] text-teal-400 font-mono block">{node.tool}</span>
                <p className="text-slate-400 text-[11px]">{node.action[language]}</p>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-900">
                {node.details[language]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 8. 7-Day Action Plan to First $100 */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
          <Zap className="w-4 h-4 text-amber-400" />
          {language === 'bs' ? 'Operativni Plan 7 Dana' : '7-Day Fast-Track Roadmap to $100'}
        </div>
        <h2 className="text-xl sm:text-3xl font-black text-white">
          {language === 'bs'
            ? 'Kako Doći Do Prvih $100 za 7 Dana (Bez Budžeta)'
            : 'How To Reach Your First $100 Within 7 Days (No Ad Spend)'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs text-indigo-400 font-bold uppercase">
              {language === 'bs' ? 'Dani 1 - 2: Postavka' : 'Days 1 - 2: Setup'}
            </span>
            <h4 className="font-bold text-white text-sm">
              {language === 'bs' ? 'Izbor Programa i Bridge Stranica' : 'Program Selection & Bridge Hub'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'bs'
                ? 'Odaberite 1 SaaS alat koji rješava bolan problem (npr. Make.com ili GoHighLevel). Otvorite besplatan Tally ili Carrd sa preporukom i affiliate linkom.'
                : 'Select 1 high-converting SaaS solving an urgent bottleneck. Create a free 1-page Tally or Carrd bridge page containing the bonus template & affiliate link.'}
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs text-teal-400 font-bold uppercase">
              {language === 'bs' ? 'Dani 3 - 5: Distribucija' : 'Days 3 - 5: Distribution'}
            </span>
            <h4 className="font-bold text-white text-sm">
              {language === 'bs' ? 'Slanje 10 Korisnih Odgovora Dnevno' : '10 Value-First Responses Daily'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'bs'
                ? 'Pronađite 10 pitanja na Redditu, Quori ili LinkedInu gdje ljudi traže rješenje. Pružite 90% odgovora i podijelite link do besplatnog šablona.'
                : 'Target 10 active questions on Reddit/LinkedIn where operators complain about manual work. Share the 3-step fix and free cloneable template.'}
            </p>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xs text-emerald-400 font-bold uppercase">
              {language === 'bs' ? 'Dani 6 - 7: Prva Zarada' : 'Days 6 - 7: First Cash'}
            </span>
            <h4 className="font-bold text-white text-sm">
              {language === 'bs' ? 'Prve Konverzije & Prvih $100' : 'First Conversions & First $100'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {language === 'bs'
                ? 'Pri 100-150 posjeta stranici, 2 do 3 korisnika aktiviraju pretplatu ili preuzimaju plaćeni nalog. Generiše se prvih $100 do $150 provizije!'
                : 'At 100-150 targeted visitors, 2 to 3 operators activate trials or upgrade. You log your first $100 to $150 in commission directly into your portal!'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
