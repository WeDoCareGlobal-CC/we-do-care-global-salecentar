import React, { useState } from 'react';
import { Language } from '../types';
import { TOOL_STACK, WORKFLOW_NODES } from '../data/blueprintData';
import { Cpu, ExternalLink, ArrowDown, Check, Layers, PlayCircle, ShieldCheck, Copy } from 'lucide-react';

interface WorkflowDiagramProps {
  language: Language;
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ language }) => {
  const [selectedNode, setSelectedNode] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              {language === 'bs' ? '1. Besplatni Stek Alata ($0 Ulog)' : '1. Free Tool Stack ($0 Capital Budget)'}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'bs'
                ? 'Svi alati su 100% besplatni za prve klijente. Nema potrebe za unosom kreditne kartice.'
                : 'All tools provide generous forever-free plans. Zero credit card needed to launch.'}
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOL_STACK.map((tool) => (
          <div
            key={tool.name}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-5 space-y-3 transition flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {tool.badge}
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  {tool.cost[language]}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {tool.name}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                {tool.role[language]}
              </p>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>{language === 'bs' ? 'Free Tier:' : 'Free Tier:'}</strong> {tool.freeTierLimit[language]}
                </span>
              </div>
            </div>

            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl transition mt-2 cursor-pointer"
            >
              <span>{language === 'bs' ? 'Otvorite Sajt' : 'Visit Official Tool'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      {/* Visual Workflow Diagram Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          {language === 'bs' ? '2. Dijagram Automatizacije u Make.com / Zapier-u' : '2. Make.com / Zapier Automation Workflow Architecture'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {language === 'bs'
            ? 'Kliknite na pojedinačni korak ispod da vidite tačna podešavanja čvora u Make.com-u'
            : 'Click on any node in the pipeline below to inspect step-by-step configuration instructions'}
        </p>
      </div>

      {/* Interactive Visual Node Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Nodes Flow List */}
        <div className="lg:col-span-7 space-y-3">
          {WORKFLOW_NODES.map((node, index) => {
            const isSelected = selectedNode === node.step;
            return (
              <React.Fragment key={node.step}>
                <div
                  onClick={() => setSelectedNode(node.step)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-850 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {node.step}
                    </div>

                    <div>
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                        {node.tool}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {node.title[language]}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {node.action[language]}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-mono">Step {node.step}/5</span>
                  </div>
                </div>

                {index < WORKFLOW_NODES.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-5 h-5 text-emerald-500/60 animate-pulse" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Node Detail Inspector Panel */}
        <div className="lg:col-span-5 sticky top-24">
          {(() => {
            const activeNode = WORKFLOW_NODES.find((n) => n.step === selectedNode) || WORKFLOW_NODES[0];
            return (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {language === 'bs' ? `KORAK ${activeNode.step} OD 5` : `NODE STEP ${activeNode.step} OF 5`}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeNode.tool}</span>
                </div>

                <h3 className="text-lg font-extrabold text-white">
                  {activeNode.title[language]}
                </h3>

                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block">{language === 'bs' ? 'Akcija Modula:' : 'Module Action:'}</span>
                    <p className="text-xs text-slate-200 font-medium">{activeNode.action[language]}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-xs text-slate-400 font-semibold block">{language === 'bs' ? 'Tehnički Detalji:' : 'Technical Details:'}</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{activeNode.details[language]}</p>
                  </div>
                </div>

                {/* Make.com Quick Connection Blueprint */}
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-emerald-400" />
                    {language === 'bs' ? 'Kako podesiti u Make.com-u:' : 'Make.com Setup Blueprint:'}
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>
                      {language === 'bs'
                        ? 'Dodajte modul: "Google Forms / Tally / Airtable"'
                        : 'Add Module: "Google Forms / Tally / Airtable"'}
                    </li>
                    <li>
                      {language === 'bs'
                        ? 'Odaberite okidač: "Watch Responses / Watch Records"'
                        : 'Select Trigger: "Watch Responses / Watch Records"'}
                    </li>
                    <li>
                      {language === 'bs'
                        ? 'Povežite Gemini / OpenAI modul sa Promptom #1'
                        : 'Connect Gemini / OpenAI Node with Master Prompt #1'}
                    </li>
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
