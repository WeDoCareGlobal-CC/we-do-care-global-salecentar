import React, { useState } from "react";
import {
  Search,
  Globe,
  Plus,
  Quote,
  Sparkles,
  ExternalLink,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Check,
  FileText,
  BookmarkPlus,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { ResearchData, ResearchSnippet } from "../types.ts";
import { requestResearch, requestMagicWeave } from "../services/api.ts";

interface ResearchAssistantProps {
  documentContext: string;
  onInsertText: (text: string) => void;
  onInsertCitation: (snippet: string, sourceTitle?: string, sourceUrl?: string) => void;
  initialQuery?: string;
}

const RESEARCH_SUGGESTIONS = [
  "James Webb Space Telescope exoplanet discoveries",
  "Deep ocean bioluminescence luciferin mechanisms",
  "Renaissance Venetian glassmaker secret guilds",
  "Quantum computing fault-tolerant qubits 2026",
];

export const ResearchAssistant: React.FC<ResearchAssistantProps> = ({
  documentContext,
  onInsertText,
  onInsertCitation,
  initialQuery = "",
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [targetUrl, setTargetUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResearch, setCurrentResearch] = useState<ResearchData | null>(null);
  const [history, setHistory] = useState<ResearchData[]>([]);
  const [insertedId, setInsertedId] = useState<string | null>(null);
  const [weavingSnippetId, setWeavingSnippetId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await requestResearch(
        searchQuery,
        targetUrl.trim() || undefined,
        includeContext ? documentContext : undefined
      );

      setCurrentResearch(data);
      setHistory((prev) => [data, ...prev.filter((item) => item.query !== data.query)]);
    } catch (err: any) {
      console.error("Research error:", err);
      setError(err?.message || "Failed to retrieve web research. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWeaveSnippet = async (snippet: ResearchSnippet, index: number) => {
    const id = `snip-${index}`;
    setWeavingSnippetId(id);
    try {
      const result = await requestMagicWeave(
        `Weave this researched fact into the manuscript prose: "${snippet.snippet}" (Context: ${snippet.context})`,
        "weave_research",
        documentContext.slice(-800) || "The narrative unfolds...",
        `Source: ${snippet.sourceTitle || snippet.sourceUrl || "Verified web report"}`
      );
      if (result.text) {
        onInsertText(`\n\n${result.text}\n\n`);
        setInsertedId(id);
        setTimeout(() => setInsertedId(null), 2500);
      }
    } catch (err: any) {
      console.error("Weaving error:", err);
      // Fallback to direct insertion
      onInsertText(`\n\n> "${snippet.snippet}"\n\n`);
    } finally {
      setWeavingSnippetId(null);
    }
  };

  const notifyInserted = (id: string) => {
    setInsertedId(id);
    setTimeout(() => setInsertedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] dark:bg-[#121110] overflow-y-auto custom-scrollbar p-4 sm:p-5 text-stone-800 dark:text-stone-200 transition-colors">
      {/* Header Banner */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">AI Research Assistant</h2>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Grounded in live Google Search. Extract verified facts, quotes & summaries into your document.
            </p>
          </div>
        </div>
      </div>

      {/* Query Search Box */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-xs mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col gap-2"
        >
          <div className="relative flex items-center">
            <input
              id="research-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topic or enter research question..."
              className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-3 pr-9 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              id="research-search-submit-btn"
              className="absolute right-1.5 p-1 rounded-md bg-stone-900 hover:bg-stone-800 text-white disabled:opacity-40 disabled:hover:bg-stone-900 transition-colors"
              title="Search and synthesize"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-200" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* URL Input Toggle */}
          <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
            <button
              type="button"
              id="toggle-url-input-btn"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="flex items-center gap-1 text-blue-700 hover:underline"
            >
              <Globe className="h-3 w-3" />
              {showUrlInput ? "Hide specific URL" : "+ Target specific URL"}
            </button>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                id="include-context-checkbox"
                type="checkbox"
                checked={includeContext}
                onChange={(e) => setIncludeContext(e.target.checked)}
                className="rounded border-stone-300 text-blue-600 focus:ring-blue-400 h-3 w-3"
              />
              <span>Ground in current draft</span>
            </label>
          </div>

          {showUrlInput && (
            <div className="pt-1">
              <input
                id="research-target-url-input"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/article-or-report"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-all font-mono"
              />
            </div>
          )}
        </form>

        {/* Suggestion Chips */}
        {!currentResearch && (
          <div className="mt-3 pt-2.5 border-t border-stone-100">
            <div className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider mb-1.5">
              Explore Inspiration
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RESEARCH_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(item);
                    handleSearch(item);
                  }}
                  className="text-left text-[11px] bg-stone-100/80 hover:bg-stone-200/70 text-stone-700 px-2 py-1 rounded-md transition-colors truncate max-w-full"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Tabs if multiple queries executed */}
      {history.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
          <span className="text-[10px] uppercase text-stone-400 font-semibold shrink-0">Recent:</span>
          {history.map((hist, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentResearch(hist);
                setQuery(hist.query);
              }}
              className={`text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap border transition-colors ${
                currentResearch?.query === hist.query
                  ? "bg-blue-50 border-blue-300 text-blue-900 font-medium"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {hist.query.slice(0, 24)}...
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 mb-4">
          <p className="font-semibold mb-1">Research Request Notice</p>
          <p>{error}</p>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && (
        <div className="space-y-4 py-6">
          <div className="flex items-center justify-center gap-2 text-stone-500 text-xs py-3">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Consulting Google Search Grounding with Gemini...</span>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-stone-200 rounded w-1/3" />
            <div className="h-3 bg-stone-100 rounded w-full" />
            <div className="h-3 bg-stone-100 rounded w-5/6" />
            <div className="h-3 bg-stone-100 rounded w-4/6" />
          </div>
        </div>
      )}

      {/* Results Presentation */}
      {currentResearch && !loading && (
        <div className="space-y-4">
          {/* Executive Summary Section */}
          <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600" />
                Executive Summary
              </span>
              <button
                id="insert-summary-btn"
                onClick={() => {
                  onInsertText(`\n\n### Research Summary: ${currentResearch.query}\n\n${currentResearch.summary}\n\n`);
                  notifyInserted("summary");
                }}
                className="text-[11px] font-medium px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1 transition-colors"
                title="Insert full summary into document"
              >
                {insertedId === "summary" ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" /> Inserted
                  </>
                ) : (
                  <>
                    <Plus className="h-3 w-3" /> Insert Summary
                  </>
                )}
              </button>
            </div>
            <div className="text-xs leading-relaxed text-stone-700 space-y-2 font-serif-editor whitespace-pre-line">
              {currentResearch.summary}
            </div>
          </div>

          {/* Ready-to-Insert Synthesized Paragraph */}
          {currentResearch.readyToInsertParagraph && (
            <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/80 rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  Ready-to-Insert Synthesis
                </span>
                <button
                  id="insert-ready-paragraph-btn"
                  onClick={() => {
                    onInsertText(`\n\n${currentResearch.readyToInsertParagraph}\n\n`);
                    notifyInserted("ready-p");
                  }}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1 transition-colors shadow-2xs"
                >
                  {insertedId === "ready-p" ? (
                    <>
                      <Check className="h-3 w-3" /> Inserted into Doc
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="h-3 w-3" /> Insert into Doc
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs leading-relaxed text-stone-800 italic font-serif-editor">
                "{currentResearch.readyToInsertParagraph}"
              </p>
            </div>
          )}

          {/* Key Snippets & Quotations */}
          {currentResearch.keySnippets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="h-3.5 w-3.5 text-indigo-600" />
                  Key Snippets & Quotations ({currentResearch.keySnippets.length})
                </span>
              </div>

              <div className="space-y-2.5">
                {currentResearch.keySnippets.map((snippet, idx) => {
                  const snipId = `snippet-${idx}`;
                  const isWeaving = weavingSnippetId === `snip-${idx}`;
                  return (
                    <div
                      key={idx}
                      className="bg-white border border-stone-200 rounded-xl p-3 hover:border-stone-300 transition-all shadow-xs"
                    >
                      <div className="font-semibold text-xs text-stone-900 mb-1 flex items-center justify-between">
                        <span>{snippet.title}</span>
                        {snippet.sourceUrl && (
                          <a
                            href={snippet.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-stone-400 hover:text-blue-600 flex items-center gap-0.5"
                            title="Open verified source"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-stone-700 font-serif-editor italic bg-stone-50 border-l-2 border-stone-300 pl-2.5 py-1 my-1.5 rounded-r">
                        "{snippet.snippet}"
                      </p>

                      <p className="text-[11px] text-stone-500 mb-2">{snippet.context}</p>

                      {/* Action Buttons for Snippet */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            onInsertText(`\n\n> "${snippet.snippet}"\n\n`);
                            notifyInserted(snipId);
                          }}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1 transition-colors"
                        >
                          {insertedId === snipId ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" /> Added
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" /> Insert Quote
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onInsertCitation(snippet.snippet, snippet.sourceTitle, snippet.sourceUrl);
                            notifyInserted(`${snipId}-cite`);
                          }}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1 transition-colors"
                          title="Insert snippet with footnote citation"
                        >
                          {insertedId === `${snipId}-cite` ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" /> Cited
                            </>
                          ) : (
                            <>
                              <BookOpen className="h-3 w-3" /> Insert with Citation
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={isWeaving}
                          onClick={() => handleWeaveSnippet(snippet, idx)}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center gap-1 transition-colors"
                          title="Use AI to smoothly weave this fact into your prose"
                        >
                          {isWeaving ? (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Weave into Draft
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {currentResearch.keyTakeaways.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Key Takeaways
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const bullets = currentResearch.keyTakeaways.map((t) => `- ${t}`).join("\n");
                    onInsertText(`\n\n### Key Findings\n${bullets}\n\n`);
                    notifyInserted("all-bullets");
                  }}
                  className="text-[11px] text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  {insertedId === "all-bullets" ? "Inserted" : "Insert All"}
                </button>
              </div>

              <ul className="space-y-1.5 text-xs text-stone-700">
                {currentResearch.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-2 group">
                    <span className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{takeaway}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onInsertText(`\n- ${takeaway}\n`);
                        notifyInserted(`takeaway-${idx}`);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[10px] text-stone-500 hover:text-stone-900 p-0.5 rounded transition-opacity"
                      title="Insert single bullet"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verified Web Sources */}
          {currentResearch.groundingSources.length > 0 && (
            <div className="bg-stone-100/80 border border-stone-200/80 rounded-xl p-3 text-xs">
              <span className="font-semibold text-[11px] text-stone-500 uppercase tracking-wider block mb-1.5">
                Verified Grounding Sources ({currentResearch.groundingSources.length})
              </span>
              <div className="space-y-1">
                {currentResearch.groundingSources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-blue-700 hover:text-blue-900 hover:underline text-[11px] py-0.5 truncate"
                  >
                    <span className="truncate pr-2">{source.title || source.url}</span>
                    <ExternalLink className="h-3 w-3 shrink-0 text-stone-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
