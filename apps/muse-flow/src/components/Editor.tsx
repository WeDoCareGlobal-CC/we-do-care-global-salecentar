import React, { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
  Sparkles,
  Search,
  CheckCircle2,
  BookOpen,
  Fingerprint,
  Wand2,
  Tag,
} from "lucide-react";
import { StyleDeviation } from "../types.ts";

interface EditorProps {
  content: string;
  onChange: (newContent: string) => void;
  deviations: StyleDeviation[];
  onApplyFix: (deviation: StyleDeviation) => void;
  onQuickResearch: (selectedText: string) => void;
  onAuditSelection: (selectedText: string) => void;
  onEmulateVoiceSelection?: (selectedText: string) => void;
  onTagMoodSelection?: (selectedText: string) => void;
  activeFingerprintName?: string;
  onSelectionChange?: (selectedText: string) => void;
  editorRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  deviations,
  onApplyFix,
  onQuickResearch,
  onAuditSelection,
  onEmulateVoiceSelection,
  onTagMoodSelection,
  activeFingerprintName,
  onSelectionChange,
  editorRef,
}) => {
  const [selectedText, setSelectedText] = React.useState<string>("");
  const [selectionRange, setSelectionRange] = React.useState<{ start: number; end: number }>({
    start: 0,
    end: 0,
  });
  const [activeDeviation, setActiveDeviation] = React.useState<StyleDeviation | null>(null);

  const handleSelect = () => {
    if (!editorRef.current) return;
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const text = editorRef.current.value.substring(start, end).trim();
    setSelectedText(text);
    setSelectionRange({ start, end });
    if (onSelectionChange) {
      onSelectionChange(text);
    }

    // Check if selection matches any active deviation
    if (text) {
      const match = deviations.find(
        (d) => d.originalSnippet.toLowerCase().includes(text.toLowerCase()) ||
               text.toLowerCase().includes(d.originalSnippet.toLowerCase())
      );
      setActiveDeviation(match || null);
    } else {
      setActiveDeviation(null);
    }
  };

  const applyFormat = (prefix: string, suffix: string = prefix, placeholder: string = "text") => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || placeholder;

    const replacement = `${prefix}${selected}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    onChange(newText);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const applyHeading = (level: 1 | 2) => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const text = textarea.value;

    // Find start of current line
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", start);
    const endPos = lineEnd === -1 ? text.length : lineEnd;
    const line = text.substring(lineStart, endPos);

    const cleanLine = line.replace(/^#{1,6}\s*/, "");
    const prefix = level === 1 ? "# " : "## ";
    const newLine = `${prefix}${cleanLine}`;

    const newText = text.substring(0, lineStart) + newLine + text.substring(endPos);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length);
    }, 0);
  };

  const applyList = (ordered: boolean) => {
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const text = textarea.value;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = text.indexOf("\n", start);
    const endPos = lineEnd === -1 ? text.length : lineEnd;
    const line = text.substring(lineStart, endPos);

    const cleanLine = line.replace(/^(\*|\d+\.)\s*/, "");
    const prefix = ordered ? "1. " : "- ";
    const newLine = `${prefix}${cleanLine}`;

    const newText = text.substring(0, lineStart) + newLine + text.substring(endPos);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length);
    }, 0);
  };

  const applyQuote = () => {
    applyFormat("> ", "", "Compelling narrative passage or quote...");
  };

  const applyCitation = () => {
    applyFormat("[^", "]", "source");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF8F5] dark:bg-[#11100f] relative overflow-hidden transition-colors">
      {/* Formatting Toolbar */}
      <div className="w-full border-b border-stone-200/80 dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#161514] px-4 py-1.5 flex items-center justify-between gap-2 overflow-x-auto text-stone-600 dark:text-stone-300 transition-colors">
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="toolbar-btn-bold"
            onClick={() => applyFormat("**", "**", "bold text")}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Bold (**text**)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="toolbar-btn-italic"
            onClick={() => applyFormat("*", "*", "italic text")}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Italic (*text*)"
          >
            <Italic className="h-4 w-4" />
          </button>

          <span className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />

          <button
            type="button"
            id="toolbar-btn-h1"
            onClick={() => applyHeading(1)}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="toolbar-btn-h2"
            onClick={() => applyHeading(2)}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </button>

          <span className="w-px h-4 bg-stone-300 dark:bg-stone-700 mx-1" />

          <button
            type="button"
            id="toolbar-btn-quote"
            onClick={applyQuote}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="toolbar-btn-bullet-list"
            onClick={() => applyList(false)}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="toolbar-btn-numbered-list"
            onClick={() => applyList(true)}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            id="toolbar-btn-citation"
            onClick={applyCitation}
            className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-stone-800 rounded text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            title="Citation footnote [^source]"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>

        {/* Floating Quick Action indicator when text is highlighted */}
        {selectedText && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-stone-700 px-2.5 py-0.5 rounded-full text-xs text-amber-900 dark:text-amber-200 shadow-xs animate-fadeIn">
            <span className="truncate max-w-[110px] italic text-stone-500 dark:text-stone-400">
              "{selectedText.slice(0, 18)}..."
            </span>
            <button
              id="selection-mood-tag-btn"
              onClick={() => onTagMoodSelection && onTagMoodSelection(selectedText)}
              className="text-[11px] font-medium text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
              title="Tag this section with an intended mood (e.g. suspenseful, melancholic) for tone-matched rewrites"
            >
              <Tag className="h-3 w-3" />
              Tag Mood
            </button>
            <span className="text-stone-300 dark:text-stone-600">•</span>
            <button
              id="selection-research-btn"
              onClick={() => onQuickResearch(selectedText)}
              className="text-[11px] font-medium text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              title="Search and gather research on this phrase"
            >
              <Search className="h-3 w-3" />
              Research
            </button>
            <span className="text-stone-300 dark:text-stone-600">•</span>
            <button
              id="selection-audit-style-btn"
              onClick={() => onAuditSelection(selectedText)}
              className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              title="Audit style for this selection"
            >
              <CheckCircle2 className="h-3 w-3" />
              Style
            </button>
            {onEmulateVoiceSelection && (
              <>
                <span className="text-stone-300 dark:text-stone-600">•</span>
                <button
                  id="selection-emulate-voice-btn"
                  onClick={() => onEmulateVoiceSelection(selectedText)}
                  className="text-[11px] font-medium text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                  title="Rewrite this selection in the identified emulated voice"
                >
                  <Fingerprint className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                  {activeFingerprintName ? `Rewrite as ${activeFingerprintName.split(" ")[0]}` : "Voice"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Active Voice Indicator in Toolbar */}
        {activeFingerprintName && onEmulateVoiceSelection && (
          <button
            type="button"
            id="toolbar-active-voice-pill"
            onClick={() => onEmulateVoiceSelection("")}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 text-xs transition-colors shrink-0"
            title={`Active Emulation Voice: ${activeFingerprintName}. Click to open Voice Cloner.`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-medium text-[11px] truncate max-w-[130px]">
              Voice: {activeFingerprintName}
            </span>
            <Wand2 className="h-3 w-3 text-rose-600 dark:text-rose-400" />
          </button>
        )}
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 flex justify-center bg-[#FAF8F5] dark:bg-[#11100f] transition-colors">
        <div className="w-full max-w-3xl flex flex-col">
          {/* Active deviation quick fixer pill if cursor or selection touches a deviation */}
          {activeDeviation && (
            <div className="mb-4 p-3 bg-amber-50/90 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 rounded-xl shadow-xs flex items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-start gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                <div>
                  <span className="font-semibold text-amber-950 dark:text-amber-200">{activeDeviation.ruleName}:</span>{" "}
                  <span className="text-amber-800 dark:text-amber-300">{activeDeviation.explanation}</span>
                  <div className="mt-1 flex items-center gap-2 text-stone-600 dark:text-stone-400 font-mono text-[11px]">
                    <span className="line-through text-red-600 dark:text-red-400">"{activeDeviation.originalSnippet}"</span>
                    <span>→</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">"{activeDeviation.suggestedReplacement}"</span>
                  </div>
                </div>
              </div>
              <button
                id="inline-apply-fix-btn"
                onClick={() => {
                  onApplyFix(activeDeviation);
                  setActiveDeviation(null);
                }}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-xs whitespace-nowrap transition-colors shadow-2xs"
              >
                Apply Fix
              </button>
            </div>
          )}

          {/* Core Textarea */}
          <textarea
            id="manuscript-editor-textarea"
            ref={editorRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onSelect={handleSelect}
            onKeyUp={handleSelect}
            onClick={handleSelect}
            placeholder="Begin writing your narrative, essay, or draft here... Or open Research Assistant, Mood Annotator, or Style Guide on the right."
            className="w-full flex-1 min-h-[600px] resize-none border-0 bg-transparent text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-0 font-serif-editor text-lg sm:text-[1.125rem] leading-[1.8] placeholder:text-stone-400/70 dark:placeholder:text-stone-600 selection:bg-amber-100 dark:selection:bg-amber-950"
            spellCheck="true"
          />
        </div>
      </div>

      {/* Subtle Bottom Status Bar */}
      <div className="border-t border-stone-200/80 dark:border-stone-800 bg-[#FAF8F5]/80 dark:bg-[#161514]/80 px-6 py-1.5 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-mono transition-colors">
        <div className="flex items-center gap-3">
          <span>Markdown Supported</span>
          <span>•</span>
          <span>Highlight text to Tag Mood, Research, or Polish</span>
        </div>
        <div>
          {deviations.length > 0 ? (
            <span className="text-amber-700 dark:text-amber-400 font-sans font-medium">
              {deviations.length} style alert{deviations.length > 1 ? "s" : ""} flagged
            </span>
          ) : (
            <span className="text-stone-400 dark:text-stone-500">Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};
