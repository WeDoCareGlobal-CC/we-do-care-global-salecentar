import {setCentralToken,getCentralToken} from './centralSession';
import React, { useState, useEffect } from 'react';
import { Language, ChecklistItem } from './types';
import { LAUNCH_CHECKLIST, REVENUE_STREAMS } from './data/blueprintData';
import { Header } from './components/Header';
import { PilotOrderIntake } from './components/PilotOrderIntake';
import { RevenueMatrix } from './components/RevenueMatrix';
import { WorkflowDiagram } from './components/WorkflowDiagram';
import { PromptLibrary } from './components/PromptLibrary';
import { OutreachScripts } from './components/OutreachScripts';
import { LandingPageCopy } from './components/LandingPageCopy';
import { PricingCalculator } from './components/PricingCalculator';
import { ChecklistTracker } from './components/ChecklistTracker';
import { CustomGeneratorModal } from './components/CustomGeneratorModal';
import { HermesEngineView } from './components/HermesEngineView';
import { AffiliateBlueprintView } from './components/AffiliateBlueprintView';
import { Sparkles, ArrowRight, ShieldCheck, Zap, DollarSign, Award, Bot } from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('bs');
  const [scEmail,setScEmail]=useState('');
  const [scPassword,setScPassword]=useState('');
  const [scLogin,setScLogin]=useState(false);
  const [scMessage,setScMessage]=useState('');
  async function signInSaleCentar(e:React.FormEvent){
    e.preventDefault();
    try{
      const response=await fetch('/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:scEmail,password:scPassword})});
      const result=await response.json();
      if(!response.ok)throw new Error(result.error||'Login failed');
      setCentralToken(result.token);setScLogin(true);setScPassword('');setScMessage('SaleCentar session active');
    }catch(e){setScMessage(e instanceof Error?e.message:'Login failed');}
  }

  const [activeTab, setActiveTab] = useState<string>('affiliate');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);

  // Sync checklist state with LocalStorage
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    try {
      const saved = localStorage.getItem('ai_profit_checklist');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return LAUNCH_CHECKLIST;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ai_profit_checklist', JSON.stringify(checklist));
    } catch (e) {
      console.error(e);
    }
  }, [checklist]);

  const toggleChecklistItem = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const completedCount = checklist.filter((i) => i.completed).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      <form onSubmit={signInSaleCentar} className="p-3 flex flex-wrap gap-2 items-center bg-slate-900 border-b border-emerald-900">
        <span className="text-sm">We Do Care Global SaleCentar</span>
        {!scLogin ? <>
          <input aria-label="Email" type="email" required placeholder="Email" value={scEmail} onChange={e=>setScEmail(e.target.value)} className="bg-slate-800 p-2 rounded"/>
          <input aria-label="Password" type="password" required placeholder="Password" value={scPassword} onChange={e=>setScPassword(e.target.value)} className="bg-slate-800 p-2 rounded"/>
          <button type="submit" className="bg-emerald-700 px-3 py-2 rounded">Login</button>
        </> : <button type="button" onClick={async()=>{const token=getCentralToken();setCentralToken('');setScLogin(false);setScMessage('Signed out');try{await fetch('/api/auth/logout',{method:'POST',headers:{authorization:`Bearer ${token}`}});}catch{setScMessage('Local session cleared; central logout could not be verified');}}} className="bg-slate-700 px-3 py-2 rounded">Sign out</button>}
        <span role="status" className="text-xs">{scMessage}</span>
      </form>
      {/* Sticky Header Nav */}
      <Header
        language={language}
        setLanguage={setLanguage}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completedChecklistCount={completedCount}
        totalChecklistCount={checklist.length}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
      />

      {/* Owner-only pilot order intake; never implies payment was collected. */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <PilotOrderIntake language={language} />
      </div>
      {/* Main Content View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab -1: Niche Affiliate Marketing AI Agent */}
        {activeTab === 'affiliate' && <AffiliateBlueprintView language={language} />}

        {/* Tab 0: Hermes AI Agent & Content Engine */}
        {activeTab === 'hermes' && <HermesEngineView language={language} />}

        {/* Tab 1: 5-Stream Matrix */}
        {activeTab === 'matrix' && (
          <RevenueMatrix
            language={language}
            onSelectWinner={() => setActiveTab('winner')}
          />
        )}

        {/* Tab 2: Winning Strategy Deep Dive */}
        {activeTab === 'winner' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4 h-4" />
                {language === 'bs' ? 'IZABRANI POBJEDNIČKI MODEL' : 'CHOSEN WINNER BLUEPRINT'}
              </div>

              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {language === 'bs'
                  ? 'AI Agencija za Lokalni SEO i Automatizaciju Lead-ova'
                  : 'AI Local SEO & Lead Capture Automation Agency'}
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
                {language === 'bs'
                  ? 'Ovaj model je izabran kao apsolutno najbolji jer ne zahtijeva predznanje programiranja, započinje se sa $0 troškova alata, donosi prvu zaradu od $100 u roku od 3 do 5 dana i skalira se na $5.000+/mjesečno jer pruža direktnu finansijsku vrijednost vlasnicima lokalnih firmi.'
                  : 'Selected as the undisputed winner because it requires zero coding, operates on a $0 tool budget, lands your first $100 within 3 to 5 days, and scales to $5,000+/month by solving urgent lost revenue for local businesses.'}
              </p>

              {/* 3 Steps To First $100 Quick Roadmap */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-white text-sm">
                    {language === 'bs' ? 'Besplatni Alati & Make Workflow' : 'Free Tool Stack & Workflow'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'bs'
                      ? 'Povežite Tally formu, Airtable i Gemini API modul u Make.com-u'
                      : 'Connect Tally form, Airtable CRM, and Gemini API node in Make.com'}
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-white text-sm">
                    {language === 'bs' ? 'Slanje 10 Poruka Dnevno' : 'Send 10 Outreaches Daily'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'bs'
                      ? 'Upotrijebite Skriptu #1 i pošaljite poruke lokalnim firmama sa 15-50 recenzija'
                      : 'Use Outreach Script #1 to contact local firms with 15-50 reviews'}
                  </p>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-white text-sm">
                    {language === 'bs' ? 'Prva Uplata $149 - $299' : 'Land First $149 - $299 Payment'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'bs'
                      ? 'Snimite 3-minutni Loom video i naplatite brzu postavku u roku od 48 sati'
                      : 'Record 3-minute Loom video and close the express setup client'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setActiveTab('tools')}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <span>{language === 'bs' ? 'Pogledaj Besplatne Alate i Dijagram' : 'Inspect Free Tools & Architecture'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveTab('prompts')}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-5 py-3 rounded-xl text-xs transition cursor-pointer"
                >
                  {language === 'bs' ? 'Kopiraj AI Promptove' : 'Copy Master Prompts'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Free Tools & Workflow Diagram */}
        {activeTab === 'tools' && <WorkflowDiagram language={language} />}

        {/* Tab 4: Master AI Prompts */}
        {activeTab === 'prompts' && <PromptLibrary language={language} />}

        {/* Tab 5: Outreach Scripts */}
        {activeTab === 'scripts' && <OutreachScripts language={language} />}

        {/* Tab 6: Landing Page Copy */}
        {activeTab === 'landing' && <LandingPageCopy language={language} />}

        {/* Tab 7: Profit Calculator */}
        {activeTab === 'calculator' && <PricingCalculator language={language} />}

        {/* Tab 8: 7-Day Launch Checklist */}
        {activeTab === 'checklist' && (
          <ChecklistTracker
            language={language}
            items={checklist}
            onToggleItem={toggleChecklistItem}
          />
        )}
      </main>

      {/* Interactive Custom AI Niche Generator Modal */}
      <CustomGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        language={language}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-8 px-4 text-center text-xs space-y-2 mt-12">
        <p className="max-w-2xl mx-auto">
          {language === 'bs'
            ? '© 2026 AI Profit Inženjering. Kreirano s ciljem $0 početnog uloga i maksimalne brzine do prve zarade.'
            : '© 2026 Zero-Capital AI Profit Engine. Designed for $0 setup budget and fast execution to first $100.'}
        </p>
      </footer>
    </div>
  );
}
