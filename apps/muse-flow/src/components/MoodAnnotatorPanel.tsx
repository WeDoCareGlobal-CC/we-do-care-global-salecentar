import React, { useState } from "react";
import {
  Sparkles,
  Tag,
  Wand2,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  ArrowRight,
  Eye,
  CloudRain,
  Flame,
  Zap,
  Heart,
  Sun,
  Clock,
  Smile,
  Loader2,
  Layers,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  Compass,
} from "lucide-react";
import {
  MoodAnnotation,
  MoodTagDefinition,
  MOOD_TAG_PRESETS,
} from "../types.ts";
import { requestMoodRewrite } from "../services/api.ts";

interface MoodAnnotatorPanelProps {
  documentText: string;
  annotations: MoodAnnotation[];
  onAddAnnotation: (annotation: MoodAnnotation) => void;
  onUpdateAnnotation: (annotation: MoodAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onApplyRewrite: (originalSnippet: string, rewrittenText: string) => void;
  selectedEditorText?: string;
  onSelectSnippetInEditor?: (snippet: string) => void;
}

export const MoodAnnotatorPanel: React.FC<MoodAnnotatorPanelProps> = ({
  documentText,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onApplyRewrite,
  selectedEditorText = "",
  onSelectSnippetInEditor,
}) => {
  // New annotation creation state
  const [selectedTagId, setSelectedTagId] = useState<string>("suspenseful");
  const [customIntent, setCustomIntent] = useState<string>("");
  const [snippetInput, setSnippetInput] = useState<string>(selectedEditorText);
  const [isCreatorOpen, setIsCreatorOpen] = useState<boolean>(true);

  // Active expanded annotation for analyzing and viewing rewrites
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(
    annotations[0]?.id || null
  );

  // Analysis / rewriting loading states
  const [loadingAnnotationId, setLoadingAnnotationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<string | null>(null);

  // Update snippet input when editor selection changes and creator is open
  React.useEffect(() => {
    if (selectedEditorText && selectedEditorText.trim().length > 5) {
      setSnippetInput(selectedEditorText);
      setIsCreatorOpen(true);
    }
  }, [selectedEditorText]);

  const selectedPreset = MOOD_TAG_PRESETS.find((p) => p.id === selectedTagId) || MOOD_TAG_PRESETS[0];

  const handleCreateAnnotation = () => {
    const textToTag = snippetInput.trim() || selectedEditorText.trim();
    if (!textToTag) {
      setError("Please select text from your manuscript or paste a passage below to tag with a mood.");
      return;
    }

    setError(null);
    const newAnnotation: MoodAnnotation = {
      id: `mood-${Date.now()}`,
      textSnippet: textToTag,
      moodTag: selectedPreset.id,
      moodName: selectedPreset.name,
      customIntent: customIntent.trim() || undefined,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "pending",
    };

    onAddAnnotation(newAnnotation);
    setActiveAnnotationId(newAnnotation.id);
    setCustomIntent("");
    setSnippetInput("");

    // Automatically trigger tone-matched rewriting analysis
    handleRunMoodRewrite(newAnnotation);
  };

  const handleRunMoodRewrite = async (annotation: MoodAnnotation) => {
    setLoadingAnnotationId(annotation.id);
    setError(null);

    try {
      const result = await requestMoodRewrite(
        annotation.textSnippet,
        annotation.moodTag,
        annotation.moodName,
        annotation.customIntent,
        documentText
      );

      const updated: MoodAnnotation = {
        ...annotation,
        currentMoodAnalysis: result.currentMoodAnalysis,
        suggestions: result.suggestions,
        status: "analyzed",
      };

      onUpdateAnnotation(updated);
    } catch (err: any) {
      console.error("Mood rewrite error:", err);
      setError(err?.message || "Failed to analyze and generate tone-matched rewrites.");
    } finally {
      setLoadingAnnotationId(null);
    }
  };

  const handleApplySuggestion = (originalSnippet: string, rewrittenText: string, suggestionId: string) => {
    onApplyRewrite(originalSnippet, rewrittenText);
    setAppliedSuggestionId(suggestionId);
    setTimeout(() => setAppliedSuggestionId(null), 2500);
  };

  // Helper icon render
  const renderMoodIcon = (id: string, className: string = "h-3.5 w-3.5") => {
    switch (id) {
      case "suspenseful": return <Eye className={className} />;
      case "melancholic": return <CloudRain className={className} />;
      case "ominous": return <Flame className={className} />;
      case "ethereal": return <Sparkles className={className} />;
      case "whimsical": return <Smile className={className} />;
      case "visceral": return <Zap className={className} />;
      case "intimate": return <Heart className={className} />;
      case "triumphant": return <Sun className={className} />;
      case "nostalgic": return <Clock className={className} />;
      case "satirical": return <Zap className={className} />;
      default: return <Tag className={className} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#121110] overflow-y-auto custom-scrollbar p-4 sm:p-5 text-stone-800 dark:text-stone-200 transition-colors">
      {/* Header Banner */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 shadow-2xs">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                Mood Annotations & Tone Rewriter
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Tag manuscript sections with intended moods to get tone-matched rewrites amplifying sensory atmosphere.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="toggle-mood-creator-btn"
            onClick={() => setIsCreatorOpen(!isCreatorOpen)}
            className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 flex items-center gap-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Annotate</span>
            {isCreatorOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Mood Annotation Creator Card */}
      {isCreatorOpen && (
        <div className="bg-white dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 rounded-xl p-3.5 shadow-xs mb-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/80 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Tag Section with Intended Mood
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              {snippetInput ? `${snippetInput.split(/\s+/).filter(Boolean).length} words selected` : "Highlight in draft"}
            </span>
          </div>

          {/* Preset Mood Selector Chips */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Select Intended Mood Archetype
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {MOOD_TAG_PRESETS.map((preset) => {
                const isSelected = selectedTagId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedTagId(preset.id)}
                    className={`p-2 rounded-lg text-left border transition-all flex items-start gap-2 ${
                      isSelected
                        ? `${preset.badgeBg} ring-1 ring-amber-400/50 dark:ring-amber-500/50 shadow-2xs`
                        : "bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0" style={{ color: preset.hex }}>
                      {renderMoodIcon(preset.id, "h-3.5 w-3.5")}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{preset.name}</div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-1">
                        {preset.sensoryFocus.split(",")[0]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Mood Guidance Pill */}
          <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-stone-800 dark:text-stone-200">
              <span style={{ color: selectedPreset.hex }}>{renderMoodIcon(selectedPreset.id)}</span>
              <span>{selectedPreset.name} Blueprint:</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
              {selectedPreset.description}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-200/60 dark:border-stone-700/60">
              <strong className="text-stone-700 dark:text-stone-300">Cadence:</strong> {selectedPreset.cadenceRecommendation}
            </p>
          </div>

          {/* Snippet Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                Manuscript Section to Modulate
              </label>
              {selectedEditorText && (
                <button
                  type="button"
                  onClick={() => setSnippetInput(selectedEditorText)}
                  className="text-[10px] text-amber-700 dark:text-amber-400 hover:underline font-medium"
                >
                  Use Current Selection
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={snippetInput}
              onChange={(e) => setSnippetInput(e.target.value)}
              placeholder="Highlight any paragraph or sentence in the manuscript on the left, or paste it here..."
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg p-2 text-xs font-serif-editor text-stone-800 dark:text-stone-200 focus:bg-white dark:focus:bg-stone-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Custom Creative Intent Note */}
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Author's Nuance / Specific Intent (Optional)
            </label>
            <input
              type="text"
              value={customIntent}
              onChange={(e) => setCustomIntent(e.target.value)}
              placeholder="e.g. He feels watched by the window; slow down time before he turns"
              className="w-full bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-800 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Action Button */}
          <button
            type="button"
            id="apply-mood-tag-btn"
            disabled={!snippetInput.trim() && !selectedEditorText.trim()}
            onClick={handleCreateAnnotation}
            className="w-full py-2.5 px-4 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4 text-amber-300 dark:text-amber-600" />
            Tag Mood & Generate Tone-Matched Rewrites
          </button>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 p-2 rounded-lg border border-red-200 dark:border-red-900">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Annotations List & Tone Rewriting Dossier */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-200 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-stone-500" />
            Annotated Mood Sections ({annotations.length})
          </span>
          {annotations.length > 0 && (
            <span className="text-[10px] text-stone-400 font-mono">
              Click to inspect & rewrite
            </span>
          )}
        </div>

        {annotations.length === 0 ? (
          <div className="p-6 bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-xl text-center text-xs text-stone-500 dark:text-stone-400">
            <Tag className="h-8 w-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
            <p className="font-semibold text-stone-700 dark:text-stone-300 mb-1">
              No Mood Annotations Yet
            </p>
            <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
              Highlight any paragraph or sentence in your manuscript, choose a mood tag like <em>Suspenseful</em> or <em>Melancholic</em>, and the AI will offer tone-matched rewriting suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {annotations.map((ann) => {
              const isActive = activeAnnotationId === ann.id;
              const isBusy = loadingAnnotationId === ann.id;
              const tagDef = MOOD_TAG_PRESETS.find((p) => p.id === ann.moodTag);

              return (
                <div
                  key={ann.id}
                  className={`bg-white dark:bg-stone-900 border rounded-xl p-3.5 shadow-xs transition-all ${
                    isActive
                      ? "border-amber-400 dark:border-amber-500 ring-1 ring-amber-400/40"
                      : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                  }`}
                >
                  {/* Annotation Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          tagDef?.badgeBg || "bg-stone-100 dark:bg-stone-800"
                        } ${tagDef?.badgeText || "text-stone-800 dark:text-stone-200"}`}
                      >
                        {renderMoodIcon(ann.moodTag, "h-3 w-3")}
                        {ann.moodName}
                      </span>
                      {ann.currentMoodAnalysis && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                          {ann.currentMoodAnalysis.alignmentScore}% match
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {onSelectSnippetInEditor && (
                        <button
                          type="button"
                          onClick={() => onSelectSnippetInEditor(ann.textSnippet)}
                          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded"
                          title="Locate in editor"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteAnnotation(ann.id)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded"
                        title="Delete annotation"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Original Snippet */}
                  <div
                    onClick={() => setActiveAnnotationId(isActive ? null : ann.id)}
                    className="cursor-pointer"
                  >
                    <p className="text-xs font-serif-editor text-stone-700 dark:text-stone-300 italic border-l-2 border-amber-300 dark:border-amber-600 pl-2.5 my-1.5 line-clamp-3">
                      "{ann.textSnippet}"
                    </p>
                    {ann.customIntent && (
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">
                        <strong>Intent:</strong> {ann.customIntent}
                      </p>
                    )}
                  </div>

                  {/* Collapsible Inspection & Rewriting Area */}
                  {isActive && (
                    <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 space-y-3 animate-fadeIn">
                      {/* Analysis Diagnosis */}
                      {ann.currentMoodAnalysis && (
                        <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/80 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              Current Mood Diagnosis:
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                              {ann.currentMoodAnalysis.detectedMood} ({ann.currentMoodAnalysis.alignmentScore}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                            {ann.currentMoodAnalysis.critique}
                          </p>
                        </div>
                      )}

                      {/* Re-analyze / Regenerate button */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRunMoodRewrite(ann)}
                          className="text-[11px] font-medium text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1"
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Generating Tone-Matched Options...
                            </>
                          ) : (
                            <>
                              <Wand2 className="h-3 w-3" />
                              Re-generate Tone Suggestions
                            </>
                          )}
                        </button>
                      </div>

                      {/* Rewriting Suggestions List */}
                      {ann.suggestions && ann.suggestions.length > 0 && (
                        <div className="space-y-2.5 pt-1">
                          <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                            Tone-Matched Rewriting Suggestions:
                          </span>

                          {ann.suggestions.map((sug) => (
                            <div
                              key={sug.id}
                              className="bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl p-3 space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                  <Sparkles className="h-3 w-3 text-amber-500" />
                                  {sug.title}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 font-bold">
                                  {sug.alignmentScore}% Mood Match
                                </span>
                              </div>

                              {/* Rewritten Text */}
                              <div className="bg-white dark:bg-stone-900 p-2.5 rounded-lg border border-stone-200 dark:border-stone-800 font-serif-editor text-stone-800 dark:text-stone-200 leading-relaxed text-xs">
                                "{sug.rewrittenText}"
                              </div>

                              {/* Technique explanation */}
                              <p className="text-[10px] text-stone-500 dark:text-stone-400 italic">
                                <strong>Technique:</strong> {sug.techniqueExplanation}
                              </p>

                              {/* Apply Button */}
                              <div className="flex justify-end pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApplySuggestion(ann.textSnippet, sug.rewrittenText, sug.id)
                                  }
                                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors"
                                >
                                  {appliedSuggestionId === sug.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5 text-white" />
                                      Applied to Manuscript!
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRight className="h-3.5 w-3.5" />
                                      Apply Tone-Matched Rewrite
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
