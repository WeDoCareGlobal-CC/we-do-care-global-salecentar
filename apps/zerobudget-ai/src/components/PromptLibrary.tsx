import React, { useState } from 'react';
import { Language, AIPromptItem } from '../types';
import { MASTER_PROMPTS } from '../data/blueprintData';
import { Copy, Check, Sparkles, Terminal, Edit3, Sliders } from 'lucide-react';

interface PromptLibraryProps {
  language: Language;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ language }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Variables for instant test replacement
  const [variables, setVariables] = useState({
    Business_Name: 'Sarajevo Dental Clinic',
    Owner_Name: 'Dr. Mehmedović',
    Niche: 'Stomatolog / Dental',
    City: 'Sarajevo',
    Competitor_Name: 'Clinic Dental Pro',
    Google_Rating: '4.8 (24 recenzije)',
    Website_Status: 'Mobile slaba brzina, bez instant WhatsApp dugmeta',
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Replace placeholders in text
  const fillPromptText = (template: string) => {
    let result = template;
    Object.entries(variables).forEach(([key, val]) => {
      const re = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      const replacement = String(val || `{{${key}}}`);
      result = result.replace(re, () => replacement);
    });
    return result;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-400" />
              {language === 'bs' ? 'Spremne AI Prompt Biblioteke (Copy-Paste)' : 'Master Copy-Paste AI Prompt Library'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Kopirajte ove tačne promptove direktno u Make.com Gemini/OpenAI modul ili besplatni ChatGPT'
                : 'Directly copy these production-tested prompts into Make.com AI nodes or ChatGPT'}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Variable Customizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sliders className="w-4 h-4 text-emerald-400" />
          {language === 'bs' ? 'Isprobajte Promptove Sa Vašim Unosima:' : 'Live Test Variables (Fills Prompts Automatically):'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {language === 'bs' ? 'Naziv Firme:' : 'Business Name:'}
            </label>
            <input
              type="text"
              value={variables.Business_Name}
              onChange={(e) => setVariables({ ...variables, Business_Name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {language === 'bs' ? 'Ime Vlasnika:' : 'Owner Name:'}
            </label>
            <input
              type="text"
              value={variables.Owner_Name}
              onChange={(e) => setVariables({ ...variables, Owner_Name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {language === 'bs' ? 'Niša / Djelatnost:' : 'Niche:'}
            </label>
            <input
              type="text"
              value={variables.Niche}
              onChange={(e) => setVariables({ ...variables, Niche: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {language === 'bs' ? 'Grad:' : 'City:'}
            </label>
            <input
              type="text"
              value={variables.City}
              onChange={(e) => setVariables({ ...variables, City: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>
        </div>
      </div>

      {/* Prompts Accordion / List */}
      <div className="space-y-6">
        {MASTER_PROMPTS.map((item) => {
          const filledText = fillPromptText(item.promptText[language]);
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.toolTarget}
                  </span>
                  <h3 className="text-lg font-extrabold text-white">
                    {item.title[language]}
                  </h3>
                  <p className="text-xs text-slate-400">{item.purpose[language]}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(item.promptText[language], `${item.id}_raw`)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title={language === 'bs' ? 'Kopiraj sa {{varijablama}}' : 'Copy raw template'}
                  >
                    {copiedId === `${item.id}_raw` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{language === 'bs' ? 'Kopirano Raw!' : 'Copied Template!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{language === 'bs' ? 'Kopiraj Predložak' : 'Copy Template'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopy(filledText, `${item.id}_filled`)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    {copiedId === `${item.id}_filled` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-slate-950" />
                        <span>{language === 'bs' ? 'Kopirano Popunjeno!' : 'Copied Filled!'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{language === 'bs' ? 'Kopiraj Popunjeno' : 'Copy Filled'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Code Box */}
              <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {filledText}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
