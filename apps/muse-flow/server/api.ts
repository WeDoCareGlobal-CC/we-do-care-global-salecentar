import { Router, Request, Response } from "express";
import {
  performResearch,
  analyzeStyleGuide,
  analyzeStoryArc,
  expandOrWeave,
  analyzeStyleFingerprint,
  emulateStyleGeneration,
  analyzeAndRewriteMood,
  StyleGuideConfig,
} from "./gemini.js";

export const apiRouter = Router();

// Research endpoint
apiRouter.post("/research", async (req: Request, res: Response) => {
  try {
    const { query, url, documentContext } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "A search query or research topic is required." });
    }

    const result = await performResearch(query.trim(), url?.trim(), documentContext);
    return res.json(result);
  } catch (error: any) {
    console.error("Research API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to perform research with Gemini.",
    });
  }
});

// Style guide analysis endpoint
apiRouter.post("/style-guide/analyze", async (req: Request, res: Response) => {
  try {
    const { text, styleGuide } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Document text is required for style analysis." });
    }

    const defaultStyleGuide: StyleGuideConfig = {
      name: "Default Style",
      tone: "Authoritative yet engaging",
      preferredWords: [],
      avoidWords: [],
      maxSentenceLength: 28,
      voice: "active",
      oxfordComma: true,
      contractions: "allowed",
      pointOfView: "third",
      customRules: "",
    };

    const mergedConfig: StyleGuideConfig = {
      ...defaultStyleGuide,
      ...(styleGuide || {}),
    };

    const result = await analyzeStyleGuide(text, mergedConfig);
    return res.json(result);
  } catch (error: any) {
    console.error("Style Guide API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze style guide with Gemini.",
    });
  }
});

// Storytelling arc analysis endpoint
apiRouter.post("/story-arc/analyze", async (req: Request, res: Response) => {
  try {
    const { text, frameworkId } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "Draft text is required for narrative arc analysis." });
    }

    const result = await analyzeStoryArc(text, frameworkId || "freytag");
    return res.json(result);
  } catch (error: any) {
    console.error("Story Arc API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze storytelling arc with Gemini.",
    });
  }
});

// Assistant expand / weave endpoint
apiRouter.post("/magic/weave", async (req: Request, res: Response) => {
  try {
    const { promptContext, mode, currentText, additionalData } = req.body;
    if (!promptContext || !currentText) {
      return res.status(400).json({ error: "Prompt context and current text are required." });
    }

    const result = await expandOrWeave(promptContext, mode || "weave_research", currentText, additionalData);
    return res.json(result);
  } catch (error: any) {
    console.error("Magic Weave API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to process text transformation.",
    });
  }
});

// Style fingerprint extraction from reference sample
apiRouter.post("/style-fingerprint/analyze", async (req: Request, res: Response) => {
  try {
    const { referenceText, name, sourceDescription } = req.body;
    if (!referenceText || typeof referenceText !== "string" || !referenceText.trim()) {
      return res.status(400).json({ error: "Reference text or writing sample is required for style analysis." });
    }

    const result = await analyzeStyleFingerprint(
      referenceText.trim(),
      name?.trim(),
      sourceDescription?.trim()
    );
    return res.json(result);
  } catch (error: any) {
    console.error("Style Fingerprint API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze reference style with Gemini.",
    });
  }
});

// Emulate identified style for generation or rewriting
apiRouter.post("/style-fingerprint/emulate", async (req: Request, res: Response) => {
  try {
    const { styleFingerprint, action, textToRewrite, contextText, userPrompt, creativityTemperature } = req.body;
    if (!styleFingerprint) {
      return res.status(400).json({ error: "An identified Style Fingerprint is required to emulate style." });
    }
    if (action === "rewrite" && (!textToRewrite || !textToRewrite.trim())) {
      return res.status(400).json({ error: "Original text is required for rewriting." });
    }
    if (action === "expand_from_prompt" && (!userPrompt || !userPrompt.trim())) {
      return res.status(400).json({ error: "A prompt or idea is required for generation." });
    }

    const result = await emulateStyleGeneration({
      styleFingerprint,
      action: action || "rewrite",
      textToRewrite,
      contextText,
      userPrompt,
      creativityTemperature,
    });
    return res.json(result);
  } catch (error: any) {
    console.error("Style Emulation API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to emulate style with Gemini.",
    });
  }
});

// Mood analysis and tone-matched rewriting endpoint
apiRouter.post("/mood/rewrite", async (req: Request, res: Response) => {
  try {
    const { textSnippet, moodTag, moodName, customIntent, documentContext } = req.body;
    if (!textSnippet || typeof textSnippet !== "string" || !textSnippet.trim()) {
      return res.status(400).json({ error: "Text snippet is required for mood rewriting." });
    }
    if (!moodTag || !moodName) {
      return res.status(400).json({ error: "Mood tag and mood name are required." });
    }

    const result = await analyzeAndRewriteMood(
      textSnippet.trim(),
      moodTag.trim(),
      moodName.trim(),
      customIntent?.trim(),
      documentContext?.trim()
    );
    return res.json(result);
  } catch (error: any) {
    console.error("Mood Rewrite API error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to analyze and rewrite mood with Gemini.",
    });
  }
});

export default apiRouter;
