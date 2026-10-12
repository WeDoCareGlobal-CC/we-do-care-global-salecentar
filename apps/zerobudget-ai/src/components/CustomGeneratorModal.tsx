import {getCentralToken} from '../centralSession';
import React, { useState } from 'react';
import { Language } from '../types';
import { Sparkles, X, Copy, Check, Loader2, Send, Building, MapPin } from 'lucide-react';

interface CustomGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const CustomGeneratorModal: React.FC<CustomGeneratorModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [niche, setNiche] = useState<string>('Stomatolog / Dental Clinic');
  const [city, setCity] = useState<string>('Sarajevo');
  const [businessName, setBusinessName] = useState<string>('Ordinacija Dr. Perić');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setErrorMsg('');
    setResultText('');

    const systemPrompt = language === 'bs'
      ? `Kreiraj kompletan, spreman paket za prodaju za firmu "${businessName}" (Niša: ${niche}, Grad: ${city}).
Uključi sljedeća 3 dijela sa tabelarnim i profesionalnim izgledom:

1. BRZI AUDIT GUBITAKA: Izračunaj procjenu koliko poziva i zarade gube mjesečno bez automatskog SMS odgovora i Google recenzija.
2. SPREMNA COLD EMAIL PORUKA: Kratka poruka od 4 rečenice za vlasnika sa prijedlogom 3-minutnog videa.
3. KUSTOM LANDING HEADLINE: Naslov i podnaslov prilagođen tačno za ${niche} u gradu ${city}.`
      : `Create a complete ready-to-send sales kit for "${businessName}" (Niche: ${niche}, City: ${city}).
Include the following 3 sections formatted neatly with tables and bullet points:

1. MISSED REVENUE AUDIT: Estimate monthly missed leads & income without instant SMS auto-reply.
2. READY COLD EMAIL: 4-sentence outreach email offering a free 3-minute video audit.
3. TAILORED LANDING PAGE HEADLINE: High-converting headline and subheadline specifically for ${niche} in ${city}.`;

    try {
      const response = await fetch('/api/generate-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getCentralToken() || accessToken}` },
        body: JSON.stringify({ prompt: systemPrompt, language }),
      });

      const data = await response.json();

      if (data.result) {
        setResultText(data.result);
      } else if (data.error) {
        setErrorMsg(data.error || 'AI generation failed');
      }
    } catch (err) {
      setErrorMsg('AI service unavailable. No audit has been performed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {language === 'bs' ? 'Generator Prilagođenih AI Asseta' : 'Custom AI Niche Asset Generator'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Unesite ciljanu firmu, nišu i grad za kreiranje jedinstvenog audita i skripte'
                : 'Enter target business name, niche, and city to produce a tailored outreach kit'}
            </p>
          </div>
        </div>

        <label className="block text-xs text-slate-400">
          Pilot access token (kept only in this page memory)
          <input type="password" autoComplete="off" value={accessToken}
            onChange={e => setAccessToken(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white"
            placeholder="Access token" />
        </label>

        {/* Input Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {language === 'bs' ? 'Naziv Firme Klijenta:' : 'Business Name:'}
            </label>
            <div className="relative">
              <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {language === 'bs' ? 'Niša / Usluga:' : 'Niche / Service:'}
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">
              {language === 'bs' ? 'Grad / Lokacija:' : 'City / Location:'}
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>{language === 'bs' ? 'Generisanje u toku...' : 'Generating tailored assets...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{language === 'bs' ? 'Generiši Kustom Paket' : 'Generate Tailored Sales Kit'}</span>
            </>
          )}
        </button>

        {/* Generated Output */}
        {resultText && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {language === 'bs' ? 'Generisani Paket Klijenta:' : 'Generated Client Package:'}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'bs' ? 'Kopirano!' : 'Copied!') : (language === 'bs' ? 'Kopiraj Tekst' : 'Copy Kit')}</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
              {resultText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
