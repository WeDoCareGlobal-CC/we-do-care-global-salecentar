import React, { useState } from "react";
import {
  TrendingUp,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  BookOpen,
  ArrowRight,
  Loader2,
  Check,
  Compass,
  BookmarkPlus,
} from "lucide-react";
import {
  StoryArcAnalysisResult,
  ArcStage,
  NARRATIVE_FRAMEWORKS,
} from "../types.ts";
import { requestStoryArcAnalysis } from "../services/api.ts";

interface StoryArcVisualizerProps {
  documentText: string;
  onInsertText: (text: string) => void;
}

export const StoryArcVisualizer: React.FC<StoryArcVisualizerProps> = ({
  documentText,
  onInsertText,
}) => {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("freytag");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StoryArcAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [insertedBeatId, setInsertedBeatId] = useState<string | null>(null);

  const handleRunAnalysis = async (frameworkId: string = selectedFrameworkId) => {
    if (!documentText.trim()) {
      setError("Please write or load some text in your manuscript first.");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await requestStoryArcAnalysis(documentText, frameworkId);
      setAnalysisResult(result);
      if (result.stages.length > 0) {
        setActiveStageId(result.stages[0].stageId);
      }
    } catch (err: any) {
      console.error("Story Arc Analysis error:", err);
      setError(err?.message || "Failed to analyze storytelling arc.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFrameworkChange = (id: string) => {
    setSelectedFrameworkId(id);
    if (analysisResult) {
      handleRunAnalysis(id);
    }
  };

  const handleInsertBeat = (stage: ArcStage) => {
    onInsertText(`\n\n### ${stage.name}\n\n${stage.expansionSnippet}\n\n`);
    setInsertedBeatId(stage.stageId);
    setTimeout(() => setInsertedBeatId(null), 2500);
  };

  // Helper for rendering the SVG curve
  const renderSvgArc = () => {
    if (!analysisResult || analysisResult.tensionCurve.length === 0) return null;

    const width = 500;
    const height = 180;
    const paddingX = 35;
    const paddingY = 25;
    const graphWidth = width - paddingX * 2;
    const graphHeight = height - paddingY * 2;

    const points = analysisResult.tensionCurve;

    // Convert data points to SVG coordinates
    const detectedCoords = points.map((p) => {
      const x = paddingX + (p.positionPct / 100) * graphWidth;
      const y = height - paddingY - (p.detectedTension / 100) * graphHeight;
      return { x, y, ...p };
    });

    const idealCoords = points.map((p) => {
      const x = paddingX + (p.positionPct / 100) * graphWidth;
      const y = height - paddingY - (p.idealTension / 100) * graphHeight;
      return { x, y, ...p };
    });

    // Generate smooth bezier curve path for detected tension
    const buildPath = (coords: Array<{ x: number; y: number }>) => {
      if (coords.length === 0) return "";
      let path = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const p0 = coords[i];
        const p1 = coords[i + 1];
        const midX = (p0.x + p1.x) / 2;
        path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
      }
      return path;
    };

    const detectedPath = buildPath(detectedCoords);
    const idealPath = buildPath(idealCoords);
    const areaPath = `${detectedPath} L ${detectedCoords[detectedCoords.length - 1].x} ${height - paddingY} L ${detectedCoords[0].x} ${height - paddingY} Z`;

    return (
      <div className="w-full bg-stone-900 rounded-xl p-3 shadow-md border border-stone-800 text-white overflow-hidden">
        <div className="flex items-center justify-between text-xs text-stone-400 mb-2 px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-purple-300 font-medium">
              <span className="w-3 h-0.5 bg-purple-400 inline-block rounded-full" />
              Detected Manuscript Tension
            </span>
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="w-3 h-0.5 border-t border-dashed border-stone-500 inline-block" />
              Ideal Archetype Arc
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">
            Pacing: {analysisResult.pacingScore}%
          </span>
        </div>

        {/* The SVG Visualization */}
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[340px]">
            <defs>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#9333ea" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[25, 50, 75].map((level) => {
              const y = height - paddingY - (level / 100) * graphHeight;
              return (
                <line
                  key={level}
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#332d3d"
                  strokeWidth="0.8"
                  strokeDasharray="2 3"
                />
              );
            })}

            {/* Area fill under detected curve */}
            <path d={areaPath} fill="url(#curveGradient)" />

            {/* Ideal Tension Arc (Dashed Line) */}
            <path
              d={idealPath}
              fill="none"
              stroke="#71717a"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeLinecap="round"
            />

            {/* Detected Tension Arc (Solid Smooth Curve) */}
            <path
              d={detectedPath}
              fill="none"
              stroke="#c084fc"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Interactive Milestone Nodes */}
            {detectedCoords.map((point, index) => {
              const matchedStage = analysisResult.stages.find(
                (s) => s.name.toLowerCase() === point.stageName.toLowerCase()
              );
              const isSelected = matchedStage && activeStageId === matchedStage.stageId;

              return (
                <g
                  key={index}
                  className="cursor-pointer group"
                  onClick={() => {
                    if (matchedStage) setActiveStageId(matchedStage.stageId);
                  }}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? "#ec4899" : "#a855f7"}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? "2.5" : "1.5"}
                    className="transition-all duration-200"
                  />
                  {/* Label */}
                  <text
                    x={point.x}
                    y={height - paddingY + 14}
                    textAnchor="middle"
                    fill={isSelected ? "#f472b6" : "#a1a1aa"}
                    fontSize="8.5"
                    fontFamily="monospace"
                    className="select-none font-medium"
                  >
                    {point.stageName.length > 10
                      ? `${point.stageName.slice(0, 9)}.`
                      : point.stageName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const selectedStage = analysisResult?.stages.find((s) => s.stageId === activeStageId);

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#121110] overflow-y-auto custom-scrollbar p-4 sm:p-5 text-stone-800 dark:text-stone-200 transition-colors">
      {/* Header Banner */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              Storytelling Arc Visualizer
            </h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Map narrative trajectory against classic dramatic frameworks. Diagnose pacing & expand beats.
            </p>
          </div>
        </div>
      </div>

      {/* Narrative Framework Selector */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xs mb-4">
        <label className="block text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">
          Select Narrative Framework Archetype
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {NARRATIVE_FRAMEWORKS.map((fw) => (
            <button
              key={fw.id}
              type="button"
              onClick={() => handleFrameworkChange(fw.id)}
              className={`p-2 rounded-lg text-left border transition-all ${
                selectedFrameworkId === fw.id
                  ? "bg-purple-50/80 border-purple-300 text-purple-950 shadow-2xs"
                  : "bg-stone-50/70 border-stone-200 text-stone-700 hover:bg-stone-100"
              }`}
            >
              <div className="font-semibold text-xs truncate">{fw.name}</div>
              <div className="text-[10px] text-stone-500 truncate">{fw.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Analyze Button */}
        <div className="mt-3 pt-2.5 border-t border-stone-100">
          <button
            type="button"
            id="run-story-arc-analysis-btn"
            disabled={analyzing}
            onClick={() => handleRunAnalysis()}
            className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-300" />
                Analyzing Narrative Architecture...
              </>
            ) : (
              <>
                <Compass className="h-3.5 w-3.5 text-purple-300" />
                Analyze Manuscript Story Arc
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
          <p className="font-semibold mb-0.5">Story Arc Notice</p>
          <p>{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && !analyzing && (
        <div className="space-y-4">
          {/* Interactive SVG Arc Visualizer */}
          {renderSvgArc()}

          {/* Narrative Diagnosis Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Structural Flow Diagnosis
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 font-semibold">
                {analysisResult.frameworkName}
              </span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-serif-editor italic mb-3">
              "{analysisResult.overallNarrativeDiagnosis}"
            </p>

            {/* Strengths */}
            {analysisResult.strengths.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Structural Strengths
                </span>
                <ul className="space-y-1 text-xs text-stone-600">
                  {analysisResult.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Selected Stage Detail & Expansion Card */}
          {selectedStage && (
            <div className="bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-200 rounded-xl p-3.5 shadow-xs animate-fadeIn">
              {/* Stage Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-stone-900">{selectedStage.name}</span>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded-full ${
                        selectedStage.status === "strong"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedStage.status === "developing"
                          ? "bg-amber-100 text-amber-800"
                          : selectedStage.status === "rushed" || selectedStage.status === "missing"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {selectedStage.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">{selectedStage.description}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-stone-400 block font-mono">Tension Level</span>
                  <div className="flex items-baseline gap-1 text-xs font-mono">
                    <span className="font-bold text-purple-900">{selectedStage.detectedTension}</span>
                    <span className="text-stone-400">/ {selectedStage.idealTension} ideal</span>
                  </div>
                </div>
              </div>

              {/* Matched Excerpt from Draft */}
              <div className="bg-white/80 border border-stone-200/80 rounded-lg p-2.5 my-2.5 text-xs">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Draft Excerpt Found
                </span>
                {selectedStage.matchedExcerpt ? (
                  <p className="italic text-stone-700 font-serif-editor border-l-2 border-purple-300 pl-2">
                    "{selectedStage.matchedExcerpt}"
                  </p>
                ) : (
                  <p className="text-rose-700 italic">
                    ⚠️ This beat is currently absent or noticeably underdeveloped in the draft.
                  </p>
                )}
              </div>

              {/* Critique & Suggestions */}
              <div className="space-y-1.5 text-xs text-stone-700 mb-3">
                <p>
                  <strong>Critique:</strong> {selectedStage.analysis}
                </p>
                <p className="text-purple-900 bg-purple-50/60 p-2 rounded-md">
                  <strong>Revision Suggestion:</strong> {selectedStage.suggestions}
                </p>
              </div>

              {/* AI Draft Expansion Snippet */}
              {selectedStage.expansionSnippet && (
                <div className="bg-stone-900 text-stone-100 rounded-xl p-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-purple-300 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Suggested Beat Expansion (Draft)
                    </span>
                    <button
                      type="button"
                      id="insert-beat-expansion-btn"
                      onClick={() => handleInsertBeat(selectedStage)}
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      {insertedBeatId === selectedStage.stageId ? (
                        <>
                          <Check className="h-3 w-3" /> Inserted into Doc
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-3 w-3" /> Insert Beat into Story
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-stone-300 font-serif-editor leading-relaxed italic">
                    "{selectedStage.expansionSnippet}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* All Stages List */}
          <div>
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2">
              All Narrative Stages ({analysisResult.stages.length})
            </span>
            <div className="space-y-2">
              {analysisResult.stages.map((stage) => {
                const isActive = activeStageId === stage.stageId;
                return (
                  <div
                    key={stage.stageId}
                    onClick={() => setActiveStageId(stage.stageId)}
                    className={`bg-white border rounded-xl p-3 cursor-pointer transition-all shadow-xs ${
                      isActive
                        ? "border-purple-400 bg-purple-50/20 ring-1 ring-purple-300"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            stage.status === "strong"
                              ? "bg-emerald-500"
                              : stage.status === "developing"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        <span className="font-semibold text-xs text-stone-900">{stage.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-500">
                        Tension: {stage.detectedTension}% (ideal {stage.idealTension}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority Revisions Checklist */}
          {analysisResult.priorityRevisions.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block mb-2">
                Priority Revision Opportunities
              </span>
              <div className="space-y-2.5">
                {analysisResult.priorityRevisions.map((rev, idx) => (
                  <div key={idx} className="bg-stone-50 rounded-lg p-2.5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900">{rev.title}</span>
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                        {rev.stageName}
                      </span>
                    </div>
                    <p className="text-stone-600">{rev.advice}</p>
                    {rev.draftAddition && (
                      <div className="pt-1.5 flex items-center justify-between">
                        <span className="text-[10px] text-stone-400 italic truncate max-w-[200px]">
                          "{rev.draftAddition.slice(0, 40)}..."
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onInsertText(`\n\n${rev.draftAddition}\n\n`);
                          }}
                          className="text-[11px] font-medium text-purple-700 hover:underline flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" /> Insert Addition
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
