import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Settings,
  Plus,
  X,
  ArrowRight,
  RotateCcw,
  Check,
  Wand2,
  HelpCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  StyleGuideConfig,
  StyleGuideAnalysisResult,
  StyleDeviation,
  DEFAULT_STYLE_PRESETS,
} from "../types.ts";
import { requestStyleAnalysis } from "../services/api.ts";

interface StyleGuidePanelProps {
  documentText: string;
  styleGuide: StyleGuideConfig;
  onUpdateStyleGuide: (newConfig: StyleGuideConfig) => void;
  deviations: StyleDeviation[];
  onSetDeviations: (deviations: StyleDeviation[]) => void;
  onApplyFix: (deviation: StyleDeviation) => void;
  onApplyAllFixes: (deviations: StyleDeviation[]) => void;
}

export const StyleGuidePanel: React.FC<StyleGuidePanelProps> = ({
  documentText,
  styleGuide,
  onUpdateStyleGuide,
  deviations,
  onSetDeviations,
  onApplyFix,
  onApplyAllFixes,
}) => {
  const [activePresetKey, setActivePresetKey] = useState<string>("literary");
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<StyleGuideAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Tag inputs for words
  const [newPreferredWord, setNewPreferredWord] = useState("");
  const [newAvoidWord, setNewAvoidWord] = useState("");

  const handleSelectPreset = (key: string) => {
    setActivePresetKey(key);
    if (DEFAULT_STYLE_PRESETS[key]) {
      onUpdateStyleGuide({ ...DEFAULT_STYLE_PRESETS[key] });
    }
  };

  const handleAddPreferredWord = () => {
    const word = newPreferredWord.trim().toLowerCase();
    if (word && !styleGuide.preferredWords.includes(word)) {
      onUpdateStyleGuide({
        ...styleGuide,
        preferredWords: [...styleGuide.preferredWords, word],
      });
      setNewPreferredWord("");
    }
  };

  const handleRemovePreferredWord = (word: string) => {
    onUpdateStyleGuide({
      ...styleGuide,
      preferredWords: styleGuide.preferredWords.filter((w) => w !== word),
    });
  };

  const handleAddAvoidWord = () => {
    const word = newAvoidWord.trim().toLowerCase();
    if (word && !styleGuide.avoidWords.includes(word)) {
      onUpdateStyleGuide({
        ...styleGuide,
        avoidWords: [...styleGuide.avoidWords, word],
      });
      setNewAvoidWord("");
    }
  };

  const handleRemoveAvoidWord = (word: string) => {
    onUpdateStyleGuide({
      ...styleGuide,
      avoidWords: styleGuide.avoidWords.filter((w) => w !== word),
    });
  };

  const handleRunAudit = async () => {
    if (!documentText.trim()) {
      setError("Please write or load some text in the manuscript first.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await requestStyleAnalysis(documentText, styleGuide);
      setAuditResult(result);
      onSetDeviations(result.deviations);
    } catch (err: any) {
      console.error("Audit error:", err);
      setError(err?.message || "Failed to audit document against style guide.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDismissDeviation = (id: string) => {
    const updated = deviations.filter((d) => d.id !== id);
    onSetDeviations(updated);
    if (auditResult) {
      setAuditResult({
        ...auditResult,
        deviations: updated,
      });
    }
  };

  const filteredDeviations = deviations.filter((dev) => {
    if (filterCategory === "all") return true;
    return dev.category === filterCategory;
  });

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#121110] overflow-y-auto custom-scrollbar p-4 sm:p-5 text-stone-800 dark:text-stone-200 transition-colors">
      {/* Header Banner */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">Editorial Style Guide</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Define custom grammar, tone, vocabulary & structure rules. Audit and fix deviations.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="toggle-style-config-btn"
            onClick={() => setIsConfigExpanded(!isConfigExpanded)}
            className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-white border border-stone-200 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
          >
            <Sliders className="h-3.5 w-3.5 text-stone-500" />
            <span>Rules</span>
            {isConfigExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="mb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {Object.entries(DEFAULT_STYLE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPreset(key)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap border transition-all ${
                activePresetKey === key
                  ? "bg-amber-100/90 border-amber-300 text-amber-950 shadow-2xs"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Style Configuration Form */}
      {isConfigExpanded && (
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs mb-4 space-y-3.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
              Custom Style Rules Definition
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Profile: {styleGuide.name}</span>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Target Tone & Atmosphere
            </label>
            <input
              id="style-tone-input"
              type="text"
              value={styleGuide.tone}
              onChange={(e) => onUpdateStyleGuide({ ...styleGuide, tone: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:bg-white focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
              placeholder="e.g. Contemplative, sharp, witty, poetic..."
            />
          </div>

          {/* Preferred Words */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Preferred Vocabulary (Prioritize)
            </label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {styleGuide.preferredWords.map((word) => (
                <span
                  key={word}
                  className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  +{word}
                  <button
                    type="button"
                    onClick={() => handleRemovePreferredWord(word)}
                    className="hover:text-emerald-950"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newPreferredWord}
                onChange={(e) => setNewPreferredWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddPreferredWord())}
                placeholder="Add preferred word..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-xs text-stone-800"
              />
              <button
                type="button"
                onClick={handleAddPreferredWord}
                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Avoid / Banned Words */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Words to Flag / Avoid
            </label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {styleGuide.avoidWords.map((word) => (
                <span
                  key={word}
                  className="bg-red-50 text-red-800 border border-red-200 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  -{word}
                  <button
                    type="button"
                    onClick={() => handleRemoveAvoidWord(word)}
                    className="hover:text-red-950"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newAvoidWord}
                onChange={(e) => setNewAvoidWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddAvoidWord())}
                placeholder="Add banned word or cliché..."
                className="flex-1 bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-xs text-stone-800"
              />
              <button
                type="button"
                onClick={handleAddAvoidWord}
                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Sentence Structure & Mechanics */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-stone-100">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Max Sentence Length: {styleGuide.maxSentenceLength} words
              </label>
              <input
                type="range"
                min={15}
                max={45}
                value={styleGuide.maxSentenceLength}
                onChange={(e) =>
                  onUpdateStyleGuide({
                    ...styleGuide,
                    maxSentenceLength: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-amber-600 h-1.5 bg-stone-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Preferred Voice
              </label>
              <select
                value={styleGuide.voice}
                onChange={(e) =>
                  onUpdateStyleGuide({
                    ...styleGuide,
                    voice: e.target.value as any,
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800"
              >
                <option value="active">Active Voice Preferred</option>
                <option value="flexible">Flexible / Balanced</option>
                <option value="passive">Allow Passive</option>
              </select>
            </div>
          </div>

          {/* Grammar & POV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Oxford Comma
              </label>
              <select
                value={styleGuide.oxfordComma ? "yes" : "no"}
                onChange={(e) =>
                  onUpdateStyleGuide({
                    ...styleGuide,
                    oxfordComma: e.target.value === "yes",
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800"
              >
                <option value="yes">Mandatory</option>
                <option value="no">Do not use</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                Contractions
              </label>
              <select
                value={styleGuide.contractions}
                onChange={(e) =>
                  onUpdateStyleGuide({
                    ...styleGuide,
                    contractions: e.target.value as any,
                  })
                }
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs text-stone-800"
              >
                <option value="allowed">Allowed (Natural flow)</option>
                <option value="avoid">Avoid where possible</option>
                <option value="strictly_forbidden">Strictly forbidden</option>
              </select>
            </div>
          </div>

          {/* Custom Rules Freeform */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Custom Style Directives
            </label>
            <textarea
              value={styleGuide.customRules}
              onChange={(e) => onUpdateStyleGuide({ ...styleGuide, customRules: e.target.value })}
              placeholder="e.g. Always begin paragraphs with concrete nouns. Avoid using ellipses..."
              rows={2}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-800 resize-none"
            />
          </div>
        </div>
      )}

      {/* Audit Action Button */}
      <div className="mb-4">
        <button
          type="button"
          id="run-style-audit-btn"
          disabled={analyzing}
          onClick={handleRunAudit}
          className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
              Auditing Against Style Guide...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 text-amber-300" />
              Audit Manuscript Against Style Rules
            </>
          )}
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
          <p className="font-semibold mb-0.5">Style Audit Notice</p>
          <p>{error}</p>
        </div>
      )}

      {/* Audit Results Presentation */}
      {auditResult && (
        <div className="space-y-4">
          {/* Score Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Style Compliance
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl font-bold font-mono ${
                      auditResult.overallScore >= 85
                        ? "text-emerald-700"
                        : auditResult.overallScore >= 70
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}
                  >
                    {auditResult.overallScore}%
                  </span>
                  <span className="text-xs font-semibold text-stone-700">{auditResult.grade}</span>
                </div>
              </div>

              {/* Apply All Fixes Button if deviations exist */}
              {deviations.length > 0 && (
                <button
                  type="button"
                  id="apply-all-fixes-btn"
                  onClick={() => onApplyAllFixes(deviations)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Replace all deviations in document with suggested fixes"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Apply All Fixes ({deviations.length})
                </button>
              )}
            </div>

            {/* Editorial Summary */}
            <p className="text-xs text-stone-600 leading-relaxed font-serif-editor mb-3 italic">
              "{auditResult.summary}"
            </p>

            {/* Category Score Bars */}
            <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Tone & Atmosphere</span>
                <span className="font-mono font-medium">{auditResult.categoryScores.tone}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${auditResult.categoryScores.tone}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-500">Vocabulary Precision</span>
                <span className="font-mono font-medium">{auditResult.categoryScores.vocabulary}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${auditResult.categoryScores.vocabulary}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-500">Sentence Cadence & Length</span>
                <span className="font-mono font-medium">
                  {auditResult.categoryScores.sentenceStructure}%
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{ width: `${auditResult.categoryScores.sentenceStructure}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-500">Grammar & Mechanics</span>
                <span className="font-mono font-medium">{auditResult.categoryScores.grammar}%</span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${auditResult.categoryScores.grammar}%` }}
                />
              </div>
            </div>
          </div>

          {/* Strengths */}
          {auditResult.strengths.length > 0 && (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 text-xs">
              <span className="font-semibold text-[11px] text-emerald-900 uppercase tracking-wider block mb-1.5">
                Observed Strengths
              </span>
              <ul className="space-y-1 text-emerald-950">
                {auditResult.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Flagged Deviations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                Flagged Deviations ({deviations.length})
              </span>

              {/* Filter Tabs */}
              <div className="flex gap-1 text-[10px]">
                {["all", "vocabulary", "tone", "sentenceStructure", "grammar"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-1.5 py-0.5 rounded capitalize ${
                      filterCategory === cat
                        ? "bg-stone-800 text-white font-medium"
                        : "text-stone-500 hover:bg-stone-200/60"
                    }`}
                  >
                    {cat === "sentenceStructure" ? "Structure" : cat}
                  </button>
                ))}
              </div>
            </div>

            {deviations.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-800">
                <Check className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                <p className="font-semibold">Zero Style Deviations Flagged!</p>
                <p className="text-[11px] text-emerald-700">
                  Your draft harmonizes seamlessly with the defined style guide.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredDeviations.map((dev) => (
                  <div
                    key={dev.id}
                    className="bg-white border border-stone-200 rounded-xl p-3 shadow-xs hover:border-stone-300 transition-all"
                  >
                    {/* Deviation Badge & Rule */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            dev.severity === "violation"
                              ? "bg-red-100 text-red-800"
                              : dev.severity === "warning"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {dev.severity}
                        </span>
                        <span className="font-semibold text-xs text-stone-900">{dev.ruleName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400 capitalize">
                        {dev.category}
                      </span>
                    </div>

                    {/* Explanation */}
                    <p className="text-[11px] text-stone-600 mb-2">{dev.explanation}</p>

                    {/* Before & After comparison */}
                    <div className="bg-stone-50 rounded-lg p-2 text-xs space-y-1.5 mb-2.5 font-serif-editor">
                      <div className="text-red-700 line-through opacity-80">
                        "{dev.originalSnippet}"
                      </div>
                      <div className="text-emerald-800 font-medium flex items-start gap-1">
                        <ArrowRight className="h-3 w-3 text-emerald-600 mt-1 shrink-0" />
                        <span>"{dev.suggestedReplacement}"</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-100">
                      <button
                        type="button"
                        onClick={() => handleDismissDeviation(dev.id)}
                        className="text-[11px] text-stone-500 hover:text-stone-800 px-2 py-0.5 rounded transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => onApplyFix(dev)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Wand2 className="h-3 w-3" />
                        Apply Fix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
