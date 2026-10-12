import { authenticatedFetch } from "./services/session.ts";
import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header.tsx";
import { Editor } from "./components/Editor.tsx";
import { ResearchAssistant } from "./components/ResearchAssistant.tsx";
import { StyleGuidePanel } from "./components/StyleGuidePanel.tsx";
import { StoryArcVisualizer } from "./components/StoryArcVisualizer.tsx";
import { StyleVoiceEmulator } from "./components/StyleVoiceEmulator.tsx";
import { MoodAnnotatorPanel } from "./components/MoodAnnotatorPanel.tsx";
import { ExportModal } from "./components/ExportModal.tsx";
import {
  DocumentDraft,
  ActiveToolTab,
  StyleGuideConfig,
  StyleDeviation,
  StyleFingerprint,
  MoodAnnotation,
  ThemeMode,
  SAMPLE_DRAFTS,
  DEFAULT_STYLE_PRESETS,
} from "./types.ts";

const STORAGE_KEY_DRAFT = "magic_writing_current_draft";
const STORAGE_KEY_STYLE = "magic_writing_style_guide";
const STORAGE_KEY_VOICE = "magic_writing_style_voice";
const STORAGE_KEY_MOOD = "magic_writing_mood_annotations";
const STORAGE_KEY_THEME = "magic_writing_theme";

export default function App() {
  const [speechBusy,setSpeechBusy]=useState(false);
  const [speechError,setSpeechError]=useState('');
  const generateDraftAudio=async()=>{
    if(speechBusy)return;
    setSpeechError('');
    setSpeechBusy(true);
    try{
      const text=(selectedEditorText.trim()||currentDraft.content.trim()).slice(0,3000);
      if(!text)throw Error('No text available for speech');
      const response=await authenticatedFetch('/api/integrations/speech',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text})});
      if(!response.ok)throw Error(response.status===429?'Daily speech limit reached':response.status===401?'Please sign in first':'Speech service unavailable');
      const audio=await response.blob();
      const url=URL.createObjectURL(audio);
      const link=document.createElement('a');
      link.href=url;link.download='muse-flow-speech.mp3';link.click();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }catch(e){setSpeechError(e instanceof Error?e.message:'Speech failed');}
    finally{setSpeechBusy(false);}
  };
  // Theme state (dark / light) for night-time writing sessions
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {
      console.error("Failed to parse saved theme:", e);
    }
    return "light";
  });

  // Sync theme class to document root element
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (e) {
      console.error("Theme toggle error:", e);
    }
  }, [theme]);

  // Document state with localStorage restore or initial sample
  const [currentDraft, setCurrentDraft] = useState<DocumentDraft>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DRAFT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved draft:", e);
    }
    return SAMPLE_DRAFTS[0];
  });

  // Active side panel tool: "research" | "mood_annotator" | "style_guide" | "story_arc" | "voice_emulator"
  const [activeTool, setActiveTool] = useState<ActiveToolTab>("research");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Style guide rules configuration
  const [styleGuide, setStyleGuide] = useState<StyleGuideConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STYLE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved style guide:", e);
    }
    return { ...DEFAULT_STYLE_PRESETS.literary };
  });

  // Active stylistic voice fingerprint (cloned from reference sample or author)
  const [activeFingerprint, setActiveFingerprint] = useState<StyleFingerprint | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved voice fingerprint:", e);
    }
    return null;
  });

  // Mood annotations tagging sections of the document
  const [moodAnnotations, setMoodAnnotations] = useState<MoodAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MOOD);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse mood annotations:", e);
    }
    return [
      {
        id: "mood-sample-1",
        textSnippet: "Overhead, where the synthetic valley grid should have reflected its dull phosphor glow, the veil was completely shattered.",
        moodTag: "suspenseful",
        moodName: "Suspenseful & Tense",
        customIntent: "Amplify the ominous celestial rupture and breathless quiet",
        createdAt: "Earlier today",
        currentMoodAnalysis: {
          detectedMood: "Suspenseful",
          alignmentScore: 85,
          critique: "Strong visual contrast and tension; heightening the acoustic freeze makes the dread visceral.",
        },
        suggestions: [
          {
            id: "sug-demo-1",
            title: "Acoustic Freeze & Visceral Suspense",
            rewrittenText: "Overhead, where the valley grid had droned its feverish neon hum, an absolute, freezing silence fell like a dropped blade. The veil split apart without sound, stars staring down like unblinking eyes.",
            alignmentScore: 98,
            techniqueExplanation: "Introduces sudden acoustic void, lethal metallic simile, and breathless sensory vigilance to maximize suspense.",
          },
        ],
      },
    ];
  });

  // Current editor selected text for targeted operations
  const [selectedEditorText, setSelectedEditorText] = useState<string>("");

  // Style deviations flagged by the auditor
  const [deviations, setDeviations] = useState<StyleDeviation[]>([]);

  // Query pass-through for quick research from editor selection
  const [quickResearchQuery, setQuickResearchQuery] = useState<string>("");

  // Editor textarea ref for measuring cursor selection and inserting text
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // Autosave current draft
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify(currentDraft));
    } catch (e) {
      console.error("Failed to save draft to localStorage:", e);
    }
  }, [currentDraft]);

  // Autosave style guide
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STYLE, JSON.stringify(styleGuide));
    } catch (e) {
      console.error("Failed to save style guide to localStorage:", e);
    }
  }, [styleGuide]);

  // Autosave active voice fingerprint
  useEffect(() => {
    try {
      if (activeFingerprint) {
        localStorage.setItem(STORAGE_KEY_VOICE, JSON.stringify(activeFingerprint));
      }
    } catch (e) {
      console.error("Failed to save voice fingerprint:", e);
    }
  }, [activeFingerprint]);

  // Autosave mood annotations
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MOOD, JSON.stringify(moodAnnotations));
    } catch (e) {
      console.error("Failed to save mood annotations:", e);
    }
  }, [moodAnnotations]);

  // Theme toggle
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Recalculate metrics helper
  const updateContent = (newContent: string) => {
    const trimmed = newContent.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(words / 200));

    setCurrentDraft((prev) => ({
      ...prev,
      content: newContent,
      wordCount: words,
      readingTimeMinutes: readingTime,
      updatedAt: "Just now",
    }));
  };

  const updateTitle = (newTitle: string) => {
    setCurrentDraft((prev) => ({
      ...prev,
      title: newTitle,
    }));
  };

  const handleSelectDraft = (draft: DocumentDraft) => {
    setCurrentDraft(draft);
    setDeviations([]);
  };

  // Seamless text insertion helper
  const handleInsertText = (textToInsert: string) => {
    if (!editorRef.current) {
      updateContent(currentDraft.content + textToInsert);
      return;
    }

    const textarea = editorRef.current;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const current = textarea.value;

    const newContent = current.substring(0, start) + textToInsert + current.substring(end);
    updateContent(newContent);

    // Refocus cursor after inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Citation insertion helper
  const handleInsertCitation = (snippet: string, sourceTitle?: string, sourceUrl?: string) => {
    const existingCitations = (currentDraft.content.match(/\[\^\d+\]/g) || []).length;
    const citationNum = existingCitations + 1;
    const inlineMarker = `[^${citationNum}]`;
    const footnote = `\n\n[^${citationNum}]: ${sourceTitle || "Source"}${
      sourceUrl ? ` (${sourceUrl})` : ""
    } - "${snippet.slice(0, 100)}..."`;

    if (!editorRef.current) {
      updateContent(currentDraft.content + inlineMarker + footnote);
      return;
    }

    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;

    const newContent =
      current.substring(0, start) +
      ` "${snippet}"${inlineMarker} ` +
      current.substring(end) +
      footnote;

    updateContent(newContent);

    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  // Apply single style deviation fix
  const handleApplyFix = (deviation: StyleDeviation) => {
    const text = currentDraft.content;
    if (text.includes(deviation.originalSnippet)) {
      const newContent = text.replace(deviation.originalSnippet, deviation.suggestedReplacement);
      updateContent(newContent);
      setDeviations((prev) => prev.filter((d) => d.id !== deviation.id));
    }
  };

  // Apply all style deviation fixes
  const handleApplyAllFixes = (devList: StyleDeviation[]) => {
    let text = currentDraft.content;
    const remaining: StyleDeviation[] = [];

    for (const dev of devList) {
      if (text.includes(dev.originalSnippet)) {
        text = text.replace(dev.originalSnippet, dev.suggestedReplacement);
      } else {
        remaining.push(dev);
      }
    }

    updateContent(text);
    setDeviations(remaining);
  };

  // Quick research from editor selection
  const handleQuickResearch = (selectedText: string) => {
    setQuickResearchQuery(selectedText);
    setActiveTool("research");
    setIsSidebarOpen(true);
  };

  // Quick style check on selection
  const handleAuditSelection = (_selectedText: string) => {
    setActiveTool("style_guide");
    setIsSidebarOpen(true);
  };

  // Quick voice emulation on selection
  const handleEmulateVoiceSelection = (selectedText: string) => {
    if (selectedText) {
      setSelectedEditorText(selectedText);
    }
    setActiveTool("voice_emulator");
    setIsSidebarOpen(true);
  };

  // Quick mood tagging on selection
  const handleTagMoodSelection = (selectedText: string) => {
    if (selectedText) {
      setSelectedEditorText(selectedText);
    }
    setActiveTool("mood_annotator");
    setIsSidebarOpen(true);
  };

  // Replace text helper for rewritten passages
  const handleReplaceSelectionOrContent = (newText: string, originalText?: string) => {
    const current = currentDraft.content;

    // 1. If exact original text is specified and exists, replace it
    if (originalText && current.includes(originalText)) {
      const updated = current.replace(originalText, newText);
      updateContent(updated);
      return;
    }

    // 2. If editor has active selection, replace selection
    if (editorRef.current && editorRef.current.selectionStart !== editorRef.current.selectionEnd) {
      const start = editorRef.current.selectionStart;
      const end = editorRef.current.selectionEnd;
      const updated = current.substring(0, start) + newText + current.substring(end);
      updateContent(updated);
      return;
    }

    // 3. Otherwise replace full text if selectedText matches or if whole document was targeted
    if (selectedEditorText && current.includes(selectedEditorText)) {
      const updated = current.replace(selectedEditorText, newText);
      updateContent(updated);
    } else {
      updateContent(newText);
    }
  };

  // Mood annotations management
  const handleAddMoodAnnotation = (ann: MoodAnnotation) => {
    setMoodAnnotations((prev) => [ann, ...prev]);
  };

  const handleUpdateMoodAnnotation = (updated: MoodAnnotation) => {
    setMoodAnnotations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteMoodAnnotation = (id: string) => {
    setMoodAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-[#FAF8F5] dark:bg-[#121110] text-stone-900 dark:text-stone-100 transition-colors ${theme === "dark" ? "dark" : ""}`}>
      {/* Top App Header */}
      <Header
        currentDraft={currentDraft}
        onSelectDraft={handleSelectDraft}
        onUpdateTitle={updateTitle}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        styleDeviationsCount={deviations.length}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        activeFingerprintName={activeFingerprint?.name}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        moodAnnotationsCount={moodAnnotations.length}
      />

      <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-200 dark:border-stone-800">
        <button type="button" onClick={generateDraftAudio} disabled={speechBusy} className="rounded-md bg-stone-800 text-white px-3 py-2 text-sm disabled:opacity-50">
          {speechBusy?'Generating audio…':'Listen / Download MP3'}
        </button>
        <span className="text-xs text-stone-500">Uses selected text, or first 3,000 characters of draft</span>
        {speechError&&<span role="alert" className="text-xs text-red-600">{speechError}</span>}
      </div>
      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Main Writing Canvas */}
        <main className="flex-1 flex flex-col h-full overflow-hidden transition-all duration-200">
          <Editor
            content={currentDraft.content}
            onChange={updateContent}
            deviations={deviations}
            onApplyFix={handleApplyFix}
            onQuickResearch={handleQuickResearch}
            onAuditSelection={handleAuditSelection}
            onEmulateVoiceSelection={handleEmulateVoiceSelection}
            onTagMoodSelection={handleTagMoodSelection}
            activeFingerprintName={activeFingerprint?.name}
            onSelectionChange={setSelectedEditorText}
            editorRef={editorRef}
          />
        </main>

        {/* Right: AI Tools Studio Sidebar */}
        <aside
          className={`border-l border-stone-200/90 dark:border-stone-800 bg-[#FAF8F5] dark:bg-[#121110] transition-all duration-300 flex flex-col h-full shadow-lg sm:shadow-none z-30 ${
            isSidebarOpen
              ? "w-full sm:w-[420px] md:w-[460px] lg:w-[480px] xl:w-[500px]"
              : "w-0 overflow-hidden border-l-0"
          }`}
        >
          {isSidebarOpen && (
            <div className="flex-1 overflow-hidden flex flex-col h-full">
              {activeTool === "research" && (
                <ResearchAssistant
                  documentContext={currentDraft.content}
                  onInsertText={handleInsertText}
                  onInsertCitation={handleInsertCitation}
                  initialQuery={quickResearchQuery}
                />
              )}

              {activeTool === "mood_annotator" && (
                <MoodAnnotatorPanel
                  documentText={currentDraft.content}
                  annotations={moodAnnotations}
                  onAddAnnotation={handleAddMoodAnnotation}
                  onUpdateAnnotation={handleUpdateMoodAnnotation}
                  onDeleteAnnotation={handleDeleteMoodAnnotation}
                  onApplyRewrite={handleReplaceSelectionOrContent}
                  selectedEditorText={selectedEditorText}
                  onSelectSnippetInEditor={(snippet) => {
                    setSelectedEditorText(snippet);
                  }}
                />
              )}

              {activeTool === "style_guide" && (
                <StyleGuidePanel
                  documentText={currentDraft.content}
                  styleGuide={styleGuide}
                  onUpdateStyleGuide={setStyleGuide}
                  deviations={deviations}
                  onSetDeviations={setDeviations}
                  onApplyFix={handleApplyFix}
                  onApplyAllFixes={handleApplyAllFixes}
                />
              )}

              {activeTool === "story_arc" && (
                <StoryArcVisualizer
                  documentText={currentDraft.content}
                  onInsertText={handleInsertText}
                />
              )}

              {activeTool === "voice_emulator" && (
                <StyleVoiceEmulator
                  documentText={currentDraft.content}
                  activeFingerprint={activeFingerprint}
                  onSetActiveFingerprint={setActiveFingerprint}
                  onSyncToStyleGuide={setStyleGuide}
                  onInsertText={handleInsertText}
                  onReplaceSelectionOrContent={handleReplaceSelectionOrContent}
                  selectedEditorText={selectedEditorText}
                />
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Comprehensive Manuscript Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        draft={currentDraft}
        moodAnnotations={moodAnnotations}
      />
    </div>
  );
}

