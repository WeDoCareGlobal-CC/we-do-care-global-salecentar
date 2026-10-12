import React from 'react';
import { Language } from '../types';
import { Sparkles, Globe, CheckCircle2, TrendingUp, Cpu, Copy, BookOpen, DollarSign, ListTodo, Wrench, Bot } from 'lucide-react';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  completedChecklistCount: number;
  totalChecklistCount: number;
  onOpenAiGenerator: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  setLanguage,
  activeTab,
  setActiveTab,
  completedChecklistCount,
  totalChecklistCount,
  onOpenAiGenerator,
}) => {
  const percent = Math.round((completedChecklistCount / totalChecklistCount) * 100) || 0;

  const navItems = [
    { id: 'affiliate', label: language === 'bs' ? '💎 Niche Affiliate Agent' : '💎 Niche Affiliate Agent', icon: Sparkles },
    { id: 'hermes', label: language === 'bs' ? '⚡ Hermes AI Agent (10 Poboljšanja)' : '⚡ Hermes AI Agent & Content Engine', icon: Bot },
    { id: 'matrix', label: language === 'bs' ? '📊 Tabela 5 Modela' : '📊 5-Stream Matrix', icon: TrendingUp },
    { id: 'winner', label: language === 'bs' ? '🏆 Pobjednički Model' : '🏆 Winning Strategy', icon: Sparkles },
    { id: 'tools', label: language === 'bs' ? '⚙️ Besplatni Alati & Dijagram' : '⚙️ $0 Stack & Workflow', icon: Cpu },
    { id: 'prompts', label: language === 'bs' ? '🤖 Master Promptovi' : '🤖 Master Prompts', icon: Copy },
    { id: 'scripts', label: language === 'bs' ? '✉️ Skripte za Prodaju' : '✉️ Outreach Scripts', icon: BookOpen },
    { id: 'landing', label: language === 'bs' ? '📄 Kopija Landing Stranice' : '📄 Landing Page Copy', icon: Wrench },
    { id: 'calculator', label: language === 'bs' ? '🧮 Kalkulator Zarade' : '🧮 Profit Calculator', icon: DollarSign },
    { id: 'checklist', label: language === 'bs' ? '📋 Vodič 7 Dana' : '📋 7-Day Checklist', icon: ListTodo },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {language === 'bs' ? 'AI Profit Inženjering' : 'Zero-Capital AI Profit Engine'}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                {language === 'bs' ? '$0 Početni Ulog' : '$0 Capital'}
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              {language === 'bs'
                ? 'Potpuni korak-po-korak nacrt za zaradu do prvih $100 i skaliranje na $5.000+/mj'
                : 'Complete copy-paste blueprint to reach first $100 and scale to $5,000+/mo'}
            </p>
          </div>
        </div>

        {/* Action Controls & Language Switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAiGenerator}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>{language === 'bs' ? 'Generiši Prilagođenu Nišu' : 'Generate Niche Assets'}</span>
          </button>

          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded font-medium transition cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('bs')}
              className={`px-2 py-1 rounded font-medium transition cursor-pointer ${
                language === 'bs'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BHS (BiH/HR/SRB)
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Progress Bar */}
      <div className="bg-slate-950/60 px-4 py-1.5 border-t border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {language === 'bs' ? 'Progres Izvršenja Vodiča:' : 'Execution Progress:'}{' '}
              <strong className="text-emerald-400">{percent}%</strong> ({completedChecklistCount}/{totalChecklistCount}{' '}
              {language === 'bs' ? 'koraka' : 'steps'})
            </span>
          </div>
          <div className="w-32 sm:w-48 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar */}
      <nav className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-none py-2 flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
