import React from "react";
import {
  Sparkles,
  BookOpen,
  Search,
  CheckCircle2,
  TrendingUp,
  Download,
  Copy,
  Check,
  FileText,
  PanelRightClose,
  PanelRightOpen,
  Fingerprint,
  Tag,
  Sun,
  Moon,
} from "lucide-react";
import { ActiveToolTab, DocumentDraft, SAMPLE_DRAFTS, ThemeMode } from "../types.ts";

interface HeaderProps {
  currentDraft: DocumentDraft;
  onSelectDraft: (draft: DocumentDraft) => void;
  onUpdateTitle: (title: string) => void;
  activeTool: ActiveToolTab;
  onSelectTool: (tool: ActiveToolTab) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  styleDeviationsCount: number;
  onOpenExportModal: () => void;
  activeFingerprintName?: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
  moodAnnotationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentDraft,
  onSelectDraft,
  onUpdateTitle,
  activeTool,
  onSelectTool,
  isSidebarOpen,
  onToggleSidebar,
  styleDeviationsCount,
  onOpenExportModal,
  activeFingerprintName,
  theme,
  onToggleTheme,
  moodAnnotationsCount = 0,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentDraft.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800 bg-[#FAF8F5]/95 dark:bg-[#121110]/95 backdrop-blur-md px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Manuscript Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 pr-3 border-r border-stone-200 dark:border-stone-800">
            <div className="h-8 w-8 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-300 dark:text-amber-600" />
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-1.5 font-display-title">
                Magic Writing
              </div>
              <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-widest font-mono">
                Studio
              </div>
            </div>
          </div>

          {/* Editable Title */}
          <div className="flex items-center gap-2 min-w-0">
            <input
              id="document-title-input"
              type="text"
              value={currentDraft.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              placeholder="Untitled Draft..."
              className="bg-transparent hover:bg-stone-100/60 dark:hover:bg-stone-800/60 focus:bg-white dark:focus:bg-stone-900 px-2 py-1 text-sm font-medium text-stone-800 dark:text-stone-200 rounded-md border border-transparent hover:border-stone-200 dark:hover:border-stone-700 focus:border-stone-300 dark:focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 transition-colors max-w-[170px] sm:max-w-[220px] truncate"
            />

            {/* Sample Drafts Dropdown */}
            <div className="relative group">
              <button
                id="load-sample-dropdown-btn"
                className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                title="Load sample manuscripts"
              >
                <FileText className="h-3.5 w-3.5 text-stone-400" />
                <span className="hidden md:inline">Samples</span>
              </button>
              <div className="absolute left-0 mt-1 w-64 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1.5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="px-2 py-1 text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                  Select Manuscript
                </div>
                {SAMPLE_DRAFTS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => onSelectDraft(sample)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex flex-col gap-0.5 transition-colors ${
                      currentDraft.id === sample.id
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-medium"
                        : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    <span className="font-medium truncate">{sample.title}</span>
                    <span className="text-[10px] text-stone-400">
                      {sample.wordCount > 0 ? `${sample.wordCount} words` : "Empty document"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Writing Metrics */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 bg-stone-100/70 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 px-3 py-1 rounded-full">
          <span>
            <strong className="font-semibold text-stone-800 dark:text-stone-200">{currentDraft.wordCount}</strong> words
          </span>
          <span className="text-stone-300 dark:text-stone-600">•</span>
          <span>
            <strong className="font-semibold text-stone-800 dark:text-stone-200">{currentDraft.readingTimeMinutes}</strong> min read
          </span>
          <span className="text-stone-300 dark:text-stone-600">•</span>
          <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Autosaved
          </span>
        </div>

        {/* Right: AI Tools Navigation Tabs & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tool Tabs */}
          <div className="flex items-center bg-stone-200/60 dark:bg-stone-800/80 p-0.5 rounded-lg border border-stone-200 dark:border-stone-700/80">
            <button
              id="tab-research-assistant"
              onClick={() => {
                onSelectTool("research");
                if (!isSidebarOpen) onToggleSidebar();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeTool === "research" && isSidebarOpen
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
              title="Research Assistant (Search grounding & web synthesis)"
            >
              <Search className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden xl:inline">Research</span>
            </button>

            <button
              id="tab-mood-annotator"
              onClick={() => {
                onSelectTool("mood_annotator");
                if (!isSidebarOpen) onToggleSidebar();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all relative ${
                activeTool === "mood_annotator" && isSidebarOpen
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
              title="Mood Annotations & Tone Rewriting"
            >
              <Tag className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden xl:inline">Moods</span>
              {moodAnnotationsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  {moodAnnotationsCount}
                </span>
              )}
            </button>

            <button
              id="tab-style-guide"
              onClick={() => {
                onSelectTool("style_guide");
                if (!isSidebarOpen) onToggleSidebar();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all relative ${
                activeTool === "style_guide" && isSidebarOpen
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
              title="Style Guide (Rules & audit)"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden xl:inline">Style</span>
              {styleDeviationsCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  {styleDeviationsCount}
                </span>
              )}
            </button>

            <button
              id="tab-story-arc"
              onClick={() => {
                onSelectTool("story_arc");
                if (!isSidebarOpen) onToggleSidebar();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeTool === "story_arc" && isSidebarOpen
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
              title="Storytelling Arc Visualizer"
            >
              <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="hidden xl:inline">Arc</span>
            </button>

            <button
              id="tab-voice-emulator"
              onClick={() => {
                onSelectTool("voice_emulator");
                if (!isSidebarOpen) onToggleSidebar();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all relative ${
                activeTool === "voice_emulator" && isSidebarOpen
                  ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
              title={
                activeFingerprintName
                  ? `Voice Cloner & Emulator (Active: ${activeFingerprintName})`
                  : "Voice Cloner & Style Emulator"
              }
            >
              <Fingerprint className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden xl:inline">Voice</span>
              {activeFingerprintName && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                  title={`Active Voice: ${activeFingerprintName}`}
                />
              )}
            </button>
          </div>

          {/* Dark Mode Night-Time Writing Toggle */}
          <button
            type="button"
            id="toggle-dark-mode-btn"
            onClick={onToggleTheme}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 rounded-lg transition-colors"
            title={theme === "dark" ? "Switch to Light theme" : "Night-time writing mode (Dark theme)"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-stone-600" />
            )}
          </button>

          {/* Copy Manuscript Button */}
          <button
            type="button"
            id="copy-manuscript-btn"
            onClick={handleCopy}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 rounded-lg transition-colors"
            title={copied ? "Copied text!" : "Copy text"}
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>

          {/* Export Manuscript Button */}
          <button
            type="button"
            id="open-export-modal-btn"
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 dark:bg-stone-100 hover:bg-stone-800 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-medium rounded-lg shadow-2xs transition-colors"
            title="Export manuscript (Markdown, PDF, Print, Plain Text)"
          >
            <Download className="h-3.5 w-3.5 text-amber-300 dark:text-amber-600" />
            <span>Export</span>
          </button>

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            id="toggle-sidebar-btn"
            onClick={onToggleSidebar}
            className="p-1.5 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 rounded-lg transition-colors"
            title={isSidebarOpen ? "Collapse AI Studio panel" : "Expand AI Studio panel"}
          >
            {isSidebarOpen ? (
              <PanelRightClose className="h-4 w-4 text-stone-700 dark:text-stone-300" />
            ) : (
              <PanelRightOpen className="h-4 w-4 text-stone-700 dark:text-stone-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

