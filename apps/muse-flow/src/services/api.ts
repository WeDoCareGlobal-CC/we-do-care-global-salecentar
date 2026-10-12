import {authenticatedFetch} from './session';
import {
  ResearchData,
  StyleGuideConfig,
  StyleGuideAnalysisResult,
  StoryArcAnalysisResult,
  StyleFingerprint,
  EmulateGenerationRequest,
  EmulateGenerationResult,
} from "../types.ts";

export async function requestResearch(
  query: string,
  url?: string,
  documentContext?: string
): Promise<ResearchData> {
  const response = await authenticatedFetch("/api/research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, url, documentContext }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Research request failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    ...data,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export async function requestStyleAnalysis(
  text: string,
  styleGuide: StyleGuideConfig
): Promise<StyleGuideAnalysisResult> {
  const response = await authenticatedFetch("/api/style-guide/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, styleGuide }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Style guide analysis failed with status ${response.status}`);
  }

  return await response.json();
}

export async function requestStoryArcAnalysis(
  text: string,
  frameworkId: string
): Promise<StoryArcAnalysisResult> {
  const response = await authenticatedFetch("/api/story-arc/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, frameworkId }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Story arc analysis failed with status ${response.status}`);
  }

  return await response.json();
}

export async function requestMagicWeave(
  promptContext: string,
  mode: "weave_research" | "expand_beat" | "polish_style",
  currentText: string,
  additionalData?: string
): Promise<{ text: string }> {
  const response = await authenticatedFetch("/api/magic/weave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promptContext, mode, currentText, additionalData }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Magic weave failed with status ${response.status}`);
  }

  return await response.json();
}

export async function requestStyleFingerprintAnalysis(
  referenceText: string,
  name?: string,
  sourceDescription?: string
): Promise<StyleFingerprint> {
  const response = await authenticatedFetch("/api/style-fingerprint/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referenceText, name, sourceDescription }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Style analysis failed with status ${response.status}`);
  }

  return await response.json();
}

export async function requestStyleEmulation(
  request: EmulateGenerationRequest
): Promise<EmulateGenerationResult> {
  const response = await authenticatedFetch("/api/style-fingerprint/emulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Style emulation failed with status ${response.status}`);
  }

  return await response.json();
}

export async function requestMoodRewrite(
  textSnippet: string,
  moodTag: string,
  moodName: string,
  customIntent?: string,
  documentContext?: string
): Promise<{
  currentMoodAnalysis: {
    detectedMood: string;
    alignmentScore: number;
    critique: string;
  };
  suggestions: Array<{
    id: string;
    title: string;
    rewrittenText: string;
    alignmentScore: number;
    techniqueExplanation: string;
  }>;
}> {
  const response = await authenticatedFetch("/api/mood/rewrite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      textSnippet,
      moodTag,
      moodName,
      customIntent,
      documentContext,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Mood rewriting failed with status ${response.status}`);
  }

  return await response.json();
}
