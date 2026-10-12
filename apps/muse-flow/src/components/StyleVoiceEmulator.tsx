import React, { useState } from "react";
import {
  Fingerprint,
  Sparkles,
  BookOpen,
  Wand2,
  Check,
  RotateCcw,
  ArrowRight,
  Sliders,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Volume2,
  Music,
  AlignLeft,
  CheckCircle2,
  Plus,
  RefreshCw,
  Copy,
  Layers,
  Flame,
  Zap,
} from "lucide-react";
import {
  StyleFingerprint,
  EmulateGenerationResult,
  REFERENCE_STYLE_SAMPLES,
  StyleGuideConfig,
} from "../types.ts";
import {
  requestStyleFingerprintAnalysis,
  requestStyleEmulation,
} from "../services/api.ts";

interface StyleVoiceEmulatorProps {
  documentText: string;
  activeFingerprint: StyleFingerprint | null;
  onSetActiveFingerprint: (fingerprint: StyleFingerprint | null) => void;
  onSyncToStyleGuide: (newConfig: StyleGuideConfig) => void;
  onInsertText: (text: string) => void;
  onReplaceSelectionOrContent: (newText: string, originalText?: string) => void;
  selectedEditorText?: string;
}

export const StyleVoiceEmulator: React.FC<StyleVoiceEmulatorProps> = ({
  documentText,
  activeFingerprint,
  onSetActiveFingerprint,
  onSyncToStyleGuide,
  onInsertText,
  onReplaceSelectionOrContent,
  selectedEditorText = "",
}) => {
  // Input sample state
  const [selectedSampleKey, setSelectedSampleKey] = useState<string>("hemingway");
  const [customName, setCustomName] = useState<string>("Ernest Hemingway");
  const [sampleText, setSampleText] = useState<string>(REFERENCE_STYLE_SAMPLES[0].text);
  const [isSampleDrawerOpen, setIsSampleDrawerOpen] = useState<boolean>(true);

  // Analysis state
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Active sub-tab within the voice profile: "overview" | "tone" | "syntax" | "vocabulary" | "rhythm"
  const [detailTab, setDetailTab] = useState<"overview" | "tone" | "syntax" | "vocabulary" | "rhythm">("overview");

  // Emulation action state: "rewrite" | "continue" | "prompt"
  const [emulationMode, setEmulationMode] = useState<"rewrite" | "continue" | "prompt">("rewrite");
  const [promptInput, setPromptInput] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationResult, setGenerationResult] = useState<EmulateGenerationResult | null>(null);
  const [syncedNotification, setSyncedNotification] = useState<boolean>(false);
  const [insertedNotification, setInsertedNotification] = useState<boolean>(false);

  // Select reference preset
  const handleSelectPreset = (key: string) => {
    setSelectedSampleKey(key);
    if (key === "current_draft") {
      setCustomName("Current Manuscript Voice");
      setSampleText(documentText || "No manuscript content yet. Write or load a draft first.");
    } else {
      const found = REFERENCE_STYLE_SAMPLES.find((s) => s.id === key);
      if (found) {
        setCustomName(found.authorOrStyle);
        setSampleText(found.text);
      }
    }
  };

  // Run the deep stylometry analysis
  const handleAnalyze = async () => {
    if (!sampleText.trim()) {
      setAnalysisError("Please provide or select a reference writing sample to analyze.");
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const sourceDesc =
        selectedSampleKey === "current_draft"
          ? "Author's Manuscript Draft"
          : `Reference: ${customName || "Writing Sample"}`;

      const fingerprint = await requestStyleFingerprintAnalysis(
        sampleText.trim(),
        customName.trim() || "Analyzed Voice",
        sourceDesc
      );

      onSetActiveFingerprint(fingerprint);
      setIsSampleDrawerOpen(false);
    } catch (err: any) {
      console.error("Style analysis failed:", err);
      setAnalysisError(err?.message || "Failed to analyze stylistic fingerprint.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Sync identified style into the custom Style Guide rules
  const handleSyncToStyleGuide = () => {
    if (!activeFingerprint) return;

    const synchedGuide: StyleGuideConfig = {
      name: `${activeFingerprint.name} Voice`,
      tone: activeFingerprint.tone.primaryTone,
      preferredWords: activeFingerprint.vocabulary.wordsToEmulate.slice(0, 10),
      avoidWords: activeFingerprint.vocabulary.wordsOrClichésToAvoid.slice(0, 8),
      maxSentenceLength: Math.max(15, Math.min(45, Math.round(activeFingerprint.sentenceStructure.averageLengthWords * 1.4))),
      voice: activeFingerprint.sentenceStructure.complexity === "simple_staccato" ? "active" : "flexible",
      oxfordComma: !activeFingerprint.sentenceStructure.punctuationHabits.some((p) => p.toLowerCase().includes("sparse comma")),
      contractions: activeFingerprint.vocabulary.register === "academic" ? "strictly_forbidden" : "allowed",
      pointOfView: activeFingerprint.tone.emotionalDistance.toLowerCase().includes("first") ? "first" : "third",
      customRules: `Rhythm: ${activeFingerprint.rhythm.musicalityDescription}. Cadence: ${activeFingerprint.sentenceStructure.structuralCadenceNotes}. Avoid: ${activeFingerprint.vocabulary.wordsOrClichésToAvoid.join(", ")}.`,
    };

    onSyncToStyleGuide(synchedGuide);
    setSyncedNotification(true);
    setTimeout(() => setSyncedNotification(false), 3000);
  };

  // Trigger emulation generation or rewriting
  const handleRunEmulation = async () => {
    if (!activeFingerprint) {
      setGenerationError("Please analyze or select a reference style first.");
      return;
    }

    setGenerating(true);
    setGenerationError(null);
    setGenerationResult(null);

    try {
      let textToRewrite: string | undefined = undefined;
      let contextText: string | undefined = documentText;
      let userPrompt: string | undefined = undefined;

      if (emulationMode === "rewrite") {
        textToRewrite = selectedEditorText.trim() || documentText.trim();
        if (!textToRewrite) {
          setGenerationError("No text found to rewrite. Highlight a passage in the editor or ensure your draft has content.");
          setGenerating(false);
          return;
        }
      } else if (emulationMode === "continue") {
        contextText = documentText.trim();
        userPrompt = promptInput.trim() || undefined;
      } else {
        userPrompt = promptInput.trim();
        if (!userPrompt) {
          setGenerationError("Please enter a scene, prompt, or topic to generate.");
          setGenerating(false);
          return;
        }
      }

      const result = await requestStyleEmulation({
        styleFingerprint: activeFingerprint,
        action: emulationMode === "prompt" ? "expand_from_prompt" : emulationMode,
        textToRewrite,
        contextText,
        userPrompt,
      });

      setGenerationResult(result);
    } catch (err: any) {
      console.error("Emulation failed:", err);
      setGenerationError(err?.message || "Failed to emulate style.");
    } finally {
      setGenerating(false);
    }
  };

  // Apply generation result to document
  const handleApplyResult = () => {
    if (!generationResult) return;

    if (emulationMode === "rewrite" && generationResult.originalText) {
      onReplaceSelectionOrContent(generationResult.generatedText, generationResult.originalText);
    } else {
      onInsertText(`\n\n${generationResult.generatedText}\n\n`);
    }

    setInsertedNotification(true);
    setTimeout(() => setInsertedNotification(false), 2500);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#121110] overflow-y-auto custom-scrollbar p-4 sm:p-5 text-stone-800 dark:text-stone-200 transition-colors">
      {/* Header Banner */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 shadow-2xs">
              <Fingerprint className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Style Fingerprint & Voice Cloner
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Analyze reference writing samples to understand tone, rhythm, vocabulary & syntax, then emulate it.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="toggle-sample-drawer-btn"
            onClick={() => setIsSampleDrawerOpen(!isSampleDrawerOpen)}
            className="text-xs text-stone-600 hover:text-stone-900 flex items-center gap-1 bg-white border border-stone-200 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-stone-500" />
            <span>Sample</span>
            {isSampleDrawerOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Active Profile Pill */}
        {activeFingerprint && (
          <div className="mt-2.5 flex items-center justify-between p-2 bg-rose-50/70 border border-rose-200/90 rounded-xl text-xs text-rose-950">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-semibold text-rose-900 truncate">
                Active Emulation Voice: {activeFingerprint.name}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleSyncToStyleGuide}
                className="text-[10px] bg-white hover:bg-rose-100/60 border border-rose-200 px-2 py-0.5 rounded-md font-medium text-rose-800 transition-colors flex items-center gap-1"
                title="Sync this voice's tone, sentence length, and vocabulary rules to the Style Guide auditor"
              >
                <Sliders className="h-3 w-3" />
                {syncedNotification ? "Rules Synced!" : "Sync to Guide"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reference Sample Input Drawer */}
      {isSampleDrawerOpen && (
        <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs mb-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-stone-500" />
              Reference Text / Writing Sample
            </span>
            <span className="text-[10px] text-stone-400 font-mono">Sample or Author</span>
          </div>

          {/* Quick Presets Bar */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
              Select Curated Reference Master or Your Manuscript
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REFERENCE_STYLE_SAMPLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectPreset(s.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border ${
                    selectedSampleKey === s.id
                      ? "bg-rose-100 border-rose-300 text-rose-950 shadow-2xs font-semibold"
                      : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {s.authorOrStyle}
                </button>
              ))}

              {/* Current Draft Option */}
              <button
                type="button"
                onClick={() => handleSelectPreset("current_draft")}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border flex items-center gap-1 ${
                  selectedSampleKey === "current_draft"
                    ? "bg-amber-100 border-amber-300 text-amber-950 shadow-2xs font-semibold"
                    : "bg-amber-50/60 border-amber-200 text-amber-900 hover:bg-amber-100/60"
                }`}
              >
                <Sparkles className="h-3 w-3 text-amber-600" />
                My Manuscript
              </button>
            </div>
          </div>

          {/* Custom Name Label */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
              Voice / Author Label
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Joan Didion, Hemingway, or My Unique Voice"
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:bg-white focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          {/* Reference Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-stone-700">
                Sample Text to Analyze (1 to 5 paragraphs)
              </label>
              <span className="text-[10px] text-stone-400 font-mono">
                {sampleText.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={5}
              value={sampleText}
              onChange={(e) => {
                setSampleText(e.target.value);
                setSelectedSampleKey("custom");
              }}
              placeholder="Paste reference writing samples, an excerpt from an author, or your own earlier writing here..."
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs font-serif-editor text-stone-800 focus:bg-white focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* Analyze Button */}
          <button
            type="button"
            id="analyze-style-fingerprint-btn"
            disabled={analyzing}
            onClick={handleAnalyze}
            className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-rose-300" />
                Decoding Tone, Syntax, Vocabulary & Rhythm...
              </>
            ) : (
              <>
                <Fingerprint className="h-4 w-4 text-rose-300" />
                Extract Stylistic Fingerprint
              </>
            )}
          </button>

          {analysisError && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
              {analysisError}
            </p>
          )}
        </div>
      )}

      {/* Identified Style Fingerprint Profile */}
      {activeFingerprint && (
        <div className="space-y-4 mb-4">
          {/* Main Stylistic Dossier Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 inline-block mb-1">
                  Stylistic Profile
                </span>
                <h3 className="text-sm font-bold text-stone-900">{activeFingerprint.name}</h3>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                {activeFingerprint.sourceDescription}
              </span>
            </div>

            {/* Voice Essence Summary */}
            <p className="text-xs text-stone-700 leading-relaxed font-serif-editor italic border-l-2 border-rose-300 pl-2.5 my-2.5 bg-stone-50/60 py-1.5 rounded-r">
              "{activeFingerprint.overallVoiceSummary}"
            </p>

            {/* Visual Stylistic Metrics Gauges */}
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Quantitative Stylistic Metrics
              </span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                {/* Sentence Pacing */}
                <div>
                  <div className="flex justify-between text-stone-600 mb-0.5">
                    <span>Sentence Length Cadence</span>
                    <span className="font-mono font-medium">{activeFingerprint.sentenceStructure.averageLengthWords}w avg</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-rose-500 h-1.5 rounded-full"
                      style={{ width: `${activeFingerprint.metrics.sentencePacing}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-400 mt-0.5">
                    <span>Staccato</span>
                    <span>Periodic Sprawl</span>
                  </div>
                </div>

                {/* Lexical Density */}
                <div>
                  <div className="flex justify-between text-stone-600 mb-0.5">
                    <span>Lexical Density</span>
                    <span className="font-mono font-medium">{activeFingerprint.metrics.lexicalDensity}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${activeFingerprint.metrics.lexicalDensity}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-400 mt-0.5">
                    <span>Plain Anglo-Saxon</span>
                    <span>Baroque / Ornate</span>
                  </div>
                </div>

                {/* Emotional Heat */}
                <div>
                  <div className="flex justify-between text-stone-600 mb-0.5">
                    <span>Emotional Temperature</span>
                    <span className="font-mono font-medium">{activeFingerprint.metrics.emotionalHeat}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${activeFingerprint.metrics.emotionalHeat}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-400 mt-0.5">
                    <span>Detached</span>
                    <span>Passionate</span>
                  </div>
                </div>

                {/* Rhythm Variability */}
                <div>
                  <div className="flex justify-between text-stone-600 mb-0.5">
                    <span>Rhythm Variability</span>
                    <span className="font-mono font-medium">{activeFingerprint.metrics.rhythmVariability}%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${activeFingerprint.metrics.rhythmVariability}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-400 mt-0.5">
                    <span>Steady Beat</span>
                    <span>Syncopated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Tabs for Forensic Stylistic Pillars */}
            <div className="mt-3 pt-3 border-t border-stone-100">
              <div className="flex gap-1 border-b border-stone-200 pb-1.5 mb-2.5 overflow-x-auto text-xs">
                {(
                  [
                    { id: "overview", label: "Overview" },
                    { id: "tone", label: "Tone" },
                    { id: "syntax", label: "Sentence Syntax" },
                    { id: "vocabulary", label: "Vocabulary" },
                    { id: "rhythm", label: "Rhythm & Music" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDetailTab(tab.id)}
                    className={`px-2 py-0.5 rounded-md font-medium text-[11px] whitespace-nowrap transition-colors ${
                      detailTab === tab.id
                        ? "bg-stone-900 text-white shadow-2xs"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: Overview */}
              {detailTab === "overview" && (
                <div className="space-y-2 text-xs text-stone-700 animate-fadeIn">
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="font-bold text-stone-900 block mb-0.5">Core Tonal Register:</span>
                    <span>{activeFingerprint.tone.primaryTone} ({activeFingerprint.tone.moodAtmosphere})</span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="font-bold text-stone-900 block mb-0.5">Syntactic Architecture:</span>
                    <span>{activeFingerprint.sentenceStructure.complexity.replace("_", " ")} (~{activeFingerprint.sentenceStructure.averageLengthWords} words/sentence). {activeFingerprint.sentenceStructure.structuralCadenceNotes}</span>
                  </div>
                  <div className="p-2 bg-stone-50 rounded-lg">
                    <span className="font-bold text-stone-900 block mb-0.5">Rhythm & Prosody:</span>
                    <span>{activeFingerprint.rhythm.tempo.replace("_", " ")} tempo. {activeFingerprint.rhythm.musicalityDescription}</span>
                  </div>
                </div>
              )}

              {/* Tab: Tone */}
              {detailTab === "tone" && (
                <div className="space-y-2 text-xs text-stone-700 animate-fadeIn">
                  <div>
                    <span className="font-semibold text-stone-900">Primary Tone:</span>{" "}
                    <span className="text-stone-700">{activeFingerprint.tone.primaryTone}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Emotional Distance:</span>{" "}
                    <span className="text-stone-700">{activeFingerprint.tone.emotionalDistance}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Stance / Irony:</span>{" "}
                    <span className="capitalize text-stone-700">{activeFingerprint.tone.ironyLevel.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Atmospheric Mood:</span>{" "}
                    <span className="text-stone-700">{activeFingerprint.tone.moodAtmosphere}</span>
                  </div>
                </div>
              )}

              {/* Tab: Syntax & Sentence Structure */}
              {detailTab === "syntax" && (
                <div className="space-y-2 text-xs text-stone-700 animate-fadeIn">
                  <div>
                    <span className="font-semibold text-stone-900">Complexity Type:</span>{" "}
                    <span className="capitalize">{activeFingerprint.sentenceStructure.complexity.replace(/_/g, " ")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Dominant Patterns:</span>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-stone-600">
                      {activeFingerprint.sentenceStructure.dominantSyntaxPatterns.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Punctuation Habits:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {activeFingerprint.sentenceStructure.punctuationHabits.map((punct, idx) => (
                        <span key={idx} className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px]">
                          {punct}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="italic text-stone-500 pt-1 border-t border-stone-100">
                    Cadence: {activeFingerprint.sentenceStructure.structuralCadenceNotes}
                  </p>
                </div>
              )}

              {/* Tab: Vocabulary */}
              {detailTab === "vocabulary" && (
                <div className="space-y-2 text-xs text-stone-700 animate-fadeIn">
                  <div>
                    <span className="font-semibold text-stone-900">Lexical Register:</span>{" "}
                    <span className="capitalize">{activeFingerprint.vocabulary.register.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 block mb-1">Words & Motifs to Emulate:</span>
                    <div className="flex flex-wrap gap-1">
                      {activeFingerprint.vocabulary.wordsToEmulate.map((w, idx) => (
                        <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                          +{w}
                        </span>
                      ))}
                    </div>
                  </div>
                  {activeFingerprint.vocabulary.wordsOrClichésToAvoid.length > 0 && (
                    <div>
                      <span className="font-semibold text-stone-900 block mb-1">Banned Words / Clichés to Avoid:</span>
                      <div className="flex flex-wrap gap-1">
                        {activeFingerprint.vocabulary.wordsOrClichésToAvoid.map((w, idx) => (
                          <span key={idx} className="bg-red-50 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-full text-[10px]">
                            -{w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-stone-900">Sensory Modalities:</span>{" "}
                    <span className="text-stone-600">{activeFingerprint.vocabulary.sensoryPreference}</span>
                  </div>
                </div>
              )}

              {/* Tab: Rhythm & Music */}
              {detailTab === "rhythm" && (
                <div className="space-y-2 text-xs text-stone-700 animate-fadeIn">
                  <div>
                    <span className="font-semibold text-stone-900">Tempo:</span>{" "}
                    <span className="capitalize">{activeFingerprint.rhythm.tempo.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Musicality & Flow:</span>{" "}
                    <p className="text-stone-600 mt-0.5">{activeFingerprint.rhythm.musicalityDescription}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900">Sentence Length Variance:</span>{" "}
                    <span className="capitalize">{activeFingerprint.rhythm.sentenceLengthVariance.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-900 block mb-1">Sonic Textures:</span>
                    <div className="flex flex-wrap gap-1">
                      {activeFingerprint.rhythm.sonicTextures.map((st, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]">
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Emulation Studio */}
          <div className="bg-white border-2 border-rose-200 rounded-xl p-3.5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                <Wand2 className="h-4 w-4 text-rose-600" />
                Emulate Voice in Your Writing
              </span>
              <span className="text-[10px] text-stone-400 font-mono">
                Target: {activeFingerprint.name}
              </span>
            </div>

            {/* Emulation Action Selector */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                id="emulate-mode-rewrite-btn"
                onClick={() => setEmulationMode("rewrite")}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border transition-all ${
                  emulationMode === "rewrite"
                    ? "bg-rose-100/90 border-rose-300 text-rose-950 shadow-2xs font-semibold"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                Rewrite in Voice
              </button>
              <button
                type="button"
                id="emulate-mode-continue-btn"
                onClick={() => setEmulationMode("continue")}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border transition-all ${
                  emulationMode === "continue"
                    ? "bg-rose-100/90 border-rose-300 text-rose-950 shadow-2xs font-semibold"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                Continue Draft
              </button>
              <button
                type="button"
                id="emulate-mode-prompt-btn"
                onClick={() => setEmulationMode("prompt")}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium text-center border transition-all ${
                  emulationMode === "prompt"
                    ? "bg-rose-100/90 border-rose-300 text-rose-950 shadow-2xs font-semibold"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                Draft from Prompt
              </button>
            </div>

            {/* Context Notice depending on mode */}
            {emulationMode === "rewrite" && (
              <div className="bg-stone-50 rounded-lg p-2 text-xs text-stone-600">
                {selectedEditorText.trim() ? (
                  <p>
                    <span className="font-semibold text-rose-900">Selected text will be rewritten:</span>{" "}
                    <span className="italic font-serif-editor">"{selectedEditorText.slice(0, 80)}..."</span>
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold text-stone-800">Entire manuscript</span> will be rewritten adopting this style's tone, syntax, and rhythm. (Tip: highlight specific paragraphs in the editor to rewrite just that section).
                  </p>
                )}
              </div>
            )}

            {emulationMode === "continue" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-700 block">
                  Direction for Next Scene / Beat (Optional)
                </label>
                <input
                  type="text"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. He hears footsteps on the gravel; keep tension high"
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:bg-white focus:border-rose-400 focus:outline-none"
                />
              </div>
            )}

            {emulationMode === "prompt" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-stone-700 block">
                  Describe the scene, argument, or passage to generate
                </label>
                <textarea
                  rows={2}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="e.g. Describe an old lighthouse keeper inspecting the copper lamp during a storm at sea..."
                  className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-800 focus:bg-white focus:border-rose-400 focus:outline-none"
                />
              </div>
            )}

            {/* Generate Button */}
            <button
              type="button"
              id="execute-emulation-btn"
              disabled={generating}
              onClick={handleRunEmulation}
              className="w-full py-2.5 px-4 bg-rose-700 hover:bg-rose-800 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-rose-200" />
                  Channeling Voice & Emulating Style...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-200" />
                  {emulationMode === "rewrite"
                    ? `Rewrite Text in ${activeFingerprint.name} Voice`
                    : emulationMode === "continue"
                    ? `Continue Draft in ${activeFingerprint.name} Voice`
                    : `Generate Passage in ${activeFingerprint.name} Voice`}
                </>
              )}
            </button>

            {generationError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                {generationError}
              </p>
            )}

            {/* Emulated Generation Output Display */}
            {generationResult && (
              <div className="bg-stone-900 text-stone-100 rounded-xl p-3.5 shadow-md mt-3 space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    Emulated Output ({activeFingerprint.name})
                  </span>

                  <button
                    type="button"
                    id="apply-emulated-text-btn"
                    onClick={handleApplyResult}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    {insertedNotification ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Applied to Manuscript!
                      </>
                    ) : emulationMode === "rewrite" ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Replace in Manuscript
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Insert into Manuscript
                      </>
                    )}
                  </button>
                </div>

                {/* Generated Text */}
                <div className="bg-stone-950/80 rounded-lg p-3 text-stone-200 text-xs font-serif-editor leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar border border-stone-800/80">
                  {generationResult.generatedText}
                </div>

                {/* Stylistic Adaptation Explanation */}
                <div className="text-[11px] space-y-1.5 pt-1 text-stone-300">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 block">
                    Forensic Stylistic Adaptation Report:
                  </span>
                  <div className="bg-stone-800/60 rounded p-2 space-y-1 text-[11px]">
                    <p>
                      <strong className="text-stone-200">Tone Enacted:</strong>{" "}
                      {generationResult.explanation.toneAdopted}
                    </p>
                    <p>
                      <strong className="text-stone-200">Rhythm & Prosody:</strong>{" "}
                      {generationResult.explanation.rhythmTechniquesUsed}
                    </p>
                    <p>
                      <strong className="text-stone-200">Syntax & Sentence Structure:</strong>{" "}
                      {generationResult.explanation.sentenceStructureAdjustments}
                    </p>
                    {generationResult.explanation.vocabularyChoices.length > 0 && (
                      <div className="pt-0.5">
                        <strong className="text-stone-200">Key Lexical Choices:</strong>{" "}
                        <span className="italic text-rose-300">
                          {generationResult.explanation.vocabularyChoices.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
