import React from 'react';
import { Language, ChecklistItem } from '../types';
import { LAUNCH_CHECKLIST } from '../data/blueprintData';
import { ListTodo, CheckCircle2, Circle, Sparkles, Trophy, Calendar } from 'lucide-react';

interface ChecklistTrackerProps {
  language: Language;
  items: ChecklistItem[];
  onToggleItem: (id: string) => void;
}

export const ChecklistTracker: React.FC<ChecklistTrackerProps> = ({
  language,
  items,
  onToggleItem,
}) => {
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const percent = Math.round((completedCount / totalCount) * 100) || 0;

  // Group by days
  const dayGroups = [1, 2, 3, 4, 5, 7];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">
                {language === 'bs' ? '7-Dnevni Akcioni Vodič Do Prvih $100+' : '7-Day Action Roadmap To First $100+'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'bs'
                  ? 'Pratite ove tačne dnevne zadatke bez skretanja sa puta za garantovan uspjeh'
                  : 'Follow these exact daily execution steps without deviation to reach cashflow in 7 days'}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 flex items-center gap-3 shrink-0">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-xs text-slate-400 block">{language === 'bs' ? 'Ostvareno:' : 'Progress:'}</span>
              <span className="text-sm font-extrabold text-emerald-400">{completedCount} / {totalCount} {language === 'bs' ? 'koraka' : 'steps'} ({percent}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Line */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-6">
          {items.map((item, idx) => {
            const isDone = item.completed;
            return (
              <div
                key={item.id}
                onClick={() => onToggleItem(item.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-4 ${
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/40 opacity-90'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  className="mt-0.5 shrink-0 focus:outline-none cursor-pointer"
                >
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-600 hover:text-slate-400" />
                  )}
                </button>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      DAN {item.day}
                    </span>
                    <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                      {item.title[language]}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.description[language]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
