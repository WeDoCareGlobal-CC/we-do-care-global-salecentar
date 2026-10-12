import React, { useState } from 'react';
import { Language, RevenueStream } from '../types';
import { REVENUE_STREAMS } from '../data/blueprintData';
import { Award, Zap, ShieldCheck, Check, AlertTriangle, ArrowRight, DollarSign, Sparkles } from 'lucide-react';

interface RevenueMatrixProps {
  language: Language;
  onSelectWinner: () => void;
}

export const RevenueMatrix: React.FC<RevenueMatrixProps> = ({ language, onSelectWinner }) => {
  const [sortBy, setSortBy] = useState<'overall' | 'speed' | 'scalability'>('overall');

  const winner = REVENUE_STREAMS.find((s) => s.isWinner) || REVENUE_STREAMS[0];

  const sortedStreams = [...REVENUE_STREAMS].sort((a, b) => {
    if (sortBy === 'speed') return b.speedScore - a.speedScore;
    if (sortBy === 'scalability') return b.scalabilityScore - a.scalabilityScore;
    return b.overallScore - a.overallScore;
  });

  return (
    <div className="space-y-8">
      {/* Winner Spotlight Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              <Award className="w-4 h-4" />
              {language === 'bs' ? 'JEDNOGLASNI POBJEDNIK - MODEL #1' : 'UNDISPUTED #1 WINNER'}
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {winner.name[language]}
            </h2>
            
            <p className="text-slate-300 text-sm leading-relaxed">
              {winner.description[language]}
            </p>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Tehnička Prepreka' : 'Tech Barrier'}</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> {winner.difficulty[language]}
                </span>
              </div>
              
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Do Prvih $100' : 'Time to $100'}</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" /> {winner.timeTo100[language]}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Skalabilnost' : 'Scalability'}</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> {winner.scalability[language]}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Početni Ulog' : 'Initial Budget'}</span>
                <span className="text-sm font-bold text-white">$0.00 (Free Tools Only)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={onSelectWinner}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl text-sm transition shadow-xl shadow-emerald-500/20 cursor-pointer"
            >
              <span>{language === 'bs' ? 'Otvori Vodič Za Model #1' : 'Launch Winner Blueprint'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sorting & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div>
          <h3 className="text-lg font-bold text-white">
            {language === 'bs' ? 'Uporedna Analiza Svih 5 Poslovnih Modela' : 'All 5 Revenue Streams Comparison Matrix'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'bs'
              ? 'Poređenje na osnovu brzine, tehničkih prepreka i potencijala za mjesečni prihod'
              : 'Evaluation based on technical friction, speed to cashflow, and scalability'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">{language === 'bs' ? 'Poredaj po:' : 'Sort by:'}</span>
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setSortBy('overall')}
              className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                sortBy === 'overall' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'bs' ? 'Ukupna Ocjena' : 'Overall Score'}
            </button>
            <button
              onClick={() => setSortBy('speed')}
              className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                sortBy === 'speed' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'bs' ? 'Najbrže do $100' : 'Fastest $100'}
            </button>
            <button
              onClick={() => setSortBy('scalability')}
              className={`px-3 py-1 rounded font-medium transition cursor-pointer ${
                sortBy === 'scalability' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'bs' ? 'Skalabilnost' : 'Scalability'}
            </button>
          </div>
        </div>
      </div>

      {/* Full Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th scope="col" className="py-4 px-6 font-bold">{language === 'bs' ? 'Model Prihoda' : 'Revenue Stream'}</th>
              <th scope="col" className="py-4 px-4 font-bold">{language === 'bs' ? 'Prepreka' : 'Tech Friction'}</th>
              <th scope="col" className="py-4 px-4 font-bold">{language === 'bs' ? 'Vrijeme do $100' : 'Time to $100'}</th>
              <th scope="col" className="py-4 px-4 font-bold">{language === 'bs' ? 'Potencijal ($5k+/mj)' : 'Scalability'}</th>
              <th scope="col" className="py-4 px-4 font-bold text-center">{language === 'bs' ? 'Ocjena' : 'Score'}</th>
              <th scope="col" className="py-4 px-4 font-bold">{language === 'bs' ? 'Status' : 'Status'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedStreams.map((stream) => (
              <tr
                key={stream.id}
                className={`transition ${
                  stream.isWinner
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                    : 'hover:bg-slate-850'
                }`}
              >
                {/* Model Name */}
                <td className="py-4 px-6 font-medium text-white">
                  <div className="flex items-center gap-2">
                    {stream.isWinner && <Award className="w-5 h-5 text-emerald-400 shrink-0" />}
                    <div>
                      <span className="font-bold text-slate-100 block">{stream.name[language]}</span>
                      <span className="text-xs text-slate-400 block line-clamp-1">{stream.targetClients[language]}</span>
                    </div>
                  </div>
                </td>

                {/* Tech Friction */}
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    stream.techBarrierScore <= 3
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : stream.techBarrierScore <= 5
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {stream.difficulty[language]}
                  </span>
                </td>

                {/* Time to $100 */}
                <td className="py-4 px-4">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {stream.timeTo100[language]}
                  </span>
                </td>

                {/* Scalability */}
                <td className="py-4 px-4 font-semibold text-emerald-400 text-sm">
                  {stream.scalability[language]}
                </td>

                {/* Overall Score */}
                <td className="py-4 px-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-950 border border-slate-700 font-black text-sm text-emerald-400 shadow">
                    {stream.overallScore}
                  </div>
                </td>

                {/* Status / CTA */}
                <td className="py-4 px-4">
                  {stream.isWinner ? (
                    <button
                      onClick={onSelectWinner}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition cursor-pointer"
                    >
                      <span>{language === 'bs' ? 'IZABERI' : 'SELECTED'}</span>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">
                      {language === 'bs' ? 'Sporije / Sraza' : 'Lower Speed'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Why Stream #1 Crushes the Other 4 Models */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          {language === 'bs'
            ? 'Zašto je Model #1 neuporedivo najbolji izbor za start od $0?'
            : 'Why Model #1 Beats All Other 4 Revenue Streams for a $0 Start'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {language === 'bs' ? '1. Nula Troškova Software-a' : '1. Zero Software Cost'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'bs'
                ? 'Make.com nudi 1.000 besplatnih operacija mjesečno. Airtable i Tally.so su potpuno besplatni. Ne trebate kupovati oglasni prostor niti skupi CRM.'
                : 'Make.com offers 1,000 free operations/mo. Airtable & Tally are free. No ad budget or paid CRM required.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {language === 'bs' ? '2. Najbrži Prodajni Ciklus' : '2. Fastest Sales Cycle'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'bs'
                ? 'Lokalne firme (stomatolozi, servisi) gube novac SVAKI DAN kad ne odgovore na poziv. Vaša ponuda rešava njihov bol i donosi im novac unutar 24h.'
                : 'Local service businesses lose money daily when missed calls happen. Your setup fixes their direct pain in 24 hours.'}
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {language === 'bs' ? '3. Skaliranje na $5k+/mj' : '3. Scale to $5,000+/mo'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'bs'
                ? 'Jednom postavljen workflow u Make.com-u odrađuje posao za 15 klijenta istovremeno bez dodatnog rada. Sa 13 klijenata na $399/mj dostižete $5.000 čistog profita.'
                : '1 Make workflow handles 15 clients effortlessly on autopilot. 13 clients at $399/mo retainer equals $5,000+ net profit.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
