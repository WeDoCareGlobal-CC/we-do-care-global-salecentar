import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it to your environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ResearchResult {
  query: string;
  url?: string;
  summary: string;
  keySnippets: Array<{
    title: string;
    snippet: string;
    sourceTitle?: string;
    sourceUrl?: string;
    context: string;
  }>;
  keyTakeaways: string[];
  groundingSources: Array<{
    title: string;
    url: string;
  }>;
  readyToInsertParagraph: string;
}

export interface StyleGuideConfig {
  name: string;
  tone: string;
  preferredWords: string[];
  avoidWords: string[];
  maxSentenceLength: number;
  voice: "active" | "passive" | "flexible";
  oxfordComma: boolean;
  contractions: "allowed" | "avoid" | "strictly_forbidden";
  pointOfView: "first" | "second" | "third" | "any";
  customRules: string;
}

export interface StyleDeviation {
  id: string;
  originalSnippet: string;
  category: "tone" | "vocabulary" | "sentenceStructure" | "grammar" | "custom";
  ruleName: string;
  severity: "suggestion" | "warning" | "violation";
  explanation: string;
  suggestedReplacement: string;
}

export interface StyleGuideAnalysisResult {
  overallScore: number;
  grade: "Excellent" | "Good" | "Needs Attention" | "Requires Revision";
  summary: string;
  categoryScores: {
    tone: number;
    vocabulary: number;
    sentenceStructure: number;
    grammar: number;
  };
  deviations: StyleDeviation[];
  strengths: string[];
}

export interface ArcStage {
  stageId: string;
  name: string;
  description: string;
  idealTension: number; // 0-100
  detectedTension: number; // 0-100
  status: "strong" | "developing" | "missing" | "rushed" | "overextended";
  matchedExcerpt: string | null;
  analysis: string;
  suggestions: string;
  expansionSnippet: string;
}

export interface StoryArcAnalysisResult {
  frameworkId: string;
  frameworkName: string;
  pacingScore: number;
  overallNarrativeDiagnosis: string;
  stages: ArcStage[];
  tensionCurve: Array<{
    positionPct: number;
    idealTension: number;
    detectedTension: number;
    stageName: string;
    note: string;
  }>;
  strengths: string[];
  priorityRevisions: Array<{
    title: string;
    stageName: string;
    advice: string;
    draftAddition: string;
  }>;
}

export interface StyleFingerprint {
  id: string;
  name: string;
  sourceDescription: string;
  analyzedAt: string;
  sampleExcerpt: string;
  overallVoiceSummary: string;
  tone: {
    primaryTone: string;
    emotionalDistance: string;
    ironyLevel: "sincere" | "mildly_ironic" | "satirical" | "detached";
    moodAtmosphere: string;
  };
  sentenceStructure: {
    averageLengthWords: number;
    complexity: "simple_staccato" | "compound_balanced" | "periodic_complex" | "stream_of_consciousness" | "varied_orchestrated";
    dominantSyntaxPatterns: string[];
    punctuationHabits: string[];
    structuralCadenceNotes: string;
  };
  vocabulary: {
    register: "informal" | "conversational" | "literary" | "academic" | "archaic_poetic";
    favoriteDescriptors: string[];
    characteristicPhrasing: string[];
    wordsToEmulate: string[];
    wordsOrClichésToAvoid: string[];
    sensoryPreference: string;
  };
  rhythm: {
    tempo: "rapid_punchy" | "measured_steady" | "languid_flowing" | "syncopated_dynamic";
    musicalityDescription: string;
    sentenceLengthVariance: "uniform" | "moderately_varied" | "dramatically_contrasting";
    sonicTextures: string[];
  };
  emulationSystemPrompt: string;
  metrics: {
    sentencePacing: number;
    lexicalDensity: number;
    emotionalHeat: number;
    sensoryTexture: number;
    rhythmVariability: number;
  };
}

export interface EmulateGenerationRequest {
  styleFingerprint: StyleFingerprint;
  action: "rewrite" | "continue" | "expand_from_prompt";
  textToRewrite?: string;
  contextText?: string;
  userPrompt?: string;
  creativityTemperature?: number;
}

export interface EmulateGenerationResult {
  generatedText: string;
  explanation: {
    toneAdopted: string;
    rhythmTechniquesUsed: string;
    vocabularyChoices: string[];
    sentenceStructureAdjustments: string;
  };
  originalText?: string;
}

/**
 * Conduct research using Google Search Grounding with Gemini 3.8 Flash
 */
export async function performResearch(
  query: string,
  targetUrl?: string,
  documentContext?: string
): Promise<ResearchResult> {
  const ai = getAI();

  const prompt = `You are an elite research assistant embedded in an authoring studio.
The user is working on a document and needs accurate, synthesized, up-to-date research.

User Query: "${query}"
${targetUrl ? `Target Specific URL to inspect and summarize: ${targetUrl}` : ""}
${documentContext ? `Context from the author's current draft:\n"""\n${documentContext.slice(0, 1500)}\n"""` : ""}

Conduct a comprehensive web research investigation using Google Search.
Provide your response in strict Markdown format with these EXACT header markers:

### EXECUTIVE_SUMMARY
(A 2-3 paragraph synthesis answering the query, highlighting verified facts, context, and nuance)

### KEY_SNIPPETS
(List 4 to 6 distinct quotable snippets or concrete data points. For each snippet use this structure:
- **Title**: [Short title]
- **Snippet**: "[Direct or paraphrased quote or statistic]"
- **Context**: [Why this matters or how to use it in writing]
- **Source**: [Source name or URL if available]
)

### KEY_TAKEAWAYS
(4 to 6 bullet points of fundamental facts/insights)

### READY_TO_INSERT_PARAGRAPH
(A beautifully written, fluent 3-5 sentence prose paragraph synthesizing the key research findings, ready for the user to insert directly into their document)
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = response.text || "";

  // Extract grounding chunks
  const groundingSources: Array<{ title: string; url: string }> = [];
  const seenUrls = new Set<string>();

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(chunks)) {
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        const url = chunk.web.uri;
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          groundingSources.push({
            title: chunk.web.title || new URL(url).hostname,
            url,
          });
        }
      }
    }
  }

  // Parse sections
  let summary = "";
  const keySnippets: ResearchResult["keySnippets"] = [];
  const keyTakeaways: string[] = [];
  let readyToInsertParagraph = "";

  const summaryMatch = rawText.match(/### EXECUTIVE_SUMMARY\s*([\s\S]*?)(?=### KEY_SNIPPETS|$)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  } else {
    summary = rawText.slice(0, 500);
  }

  const snippetsMatch = rawText.match(/### KEY_SNIPPETS\s*([\s\S]*?)(?=### KEY_TAKEAWAYS|$)/i);
  if (snippetsMatch) {
    const rawSnippetBlock = snippetsMatch[1].trim();
    const snippetBlocks = rawSnippetBlock.split(/\n(?=- \*\*Title\*\*|\d+\.\s+\*\*Title\*\*)/);
    for (const block of snippetBlocks) {
      const titleMatch = block.match(/\*\*Title\*\*:\s*([^\n]+)/i);
      const snippetContentMatch = block.match(/\*\*Snippet\*\*:\s*([^\n]+(?:\n(?!\*\*Context|\*\*Source)[^\n]+)*)/i);
      const contextMatch = block.match(/\*\*Context\*\*:\s*([^\n]+(?:\n(?!\*\*Source)[^\n]+)*)/i);
      const sourceMatch = block.match(/\*\*Source\*\*:\s*([^\n]+)/i);

      if (titleMatch || snippetContentMatch) {
        keySnippets.push({
          title: titleMatch ? titleMatch[1].trim() : "Key Insight",
          snippet: snippetContentMatch ? snippetContentMatch[1].replace(/^["']|["']$/g, "").trim() : block.trim(),
          context: contextMatch ? contextMatch[1].trim() : "Relevant background fact",
          sourceTitle: sourceMatch ? sourceMatch[1].trim() : undefined,
          sourceUrl: groundingSources[0]?.url,
        });
      }
    }
  }

  // Fallback snippets if regex block was simple bullets
  if (keySnippets.length === 0) {
    const lines = rawText.split("\n");
    for (const line of lines) {
      if (line.trim().startsWith("- ") && line.length > 25 && keySnippets.length < 5) {
        keySnippets.push({
          title: "Research Point",
          snippet: line.replace(/^-\s*/, "").trim(),
          context: "Relevant supporting fact",
        });
      }
    }
  }

  const takeawaysMatch = rawText.match(/### KEY_TAKEAWAYS\s*([\s\S]*?)(?=### READY_TO_INSERT_PARAGRAPH|$)/i);
  if (takeawaysMatch) {
    const lines = takeawaysMatch[1].split("\n");
    for (const line of lines) {
      const cleaned = line.replace(/^[-*•\d.]+\s*/, "").trim();
      if (cleaned.length > 5) {
        keyTakeaways.push(cleaned);
      }
    }
  }

  const readyMatch = rawText.match(/### READY_TO_INSERT_PARAGRAPH\s*([\s\S]*?)$/i);
  if (readyMatch) {
    readyToInsertParagraph = readyMatch[1].trim();
  } else {
    readyToInsertParagraph = summary.split("\n\n")[0] || summary;
  }

  return {
    query,
    url: targetUrl,
    summary,
    keySnippets,
    keyTakeaways,
    groundingSources,
    readyToInsertParagraph,
  };
}

/**
 * Analyze writing against custom style rules
 */
export async function analyzeStyleGuide(
  text: string,
  styleGuide: StyleGuideConfig
): Promise<StyleGuideAnalysisResult> {
  const ai = getAI();

  const prompt = `You are an expert editorial auditor evaluating writing against a precise custom Style Guide.

STYLE GUIDE RULES:
- Target Tone: ${styleGuide.tone}
- Preferred Vocabulary: ${styleGuide.preferredWords.length > 0 ? styleGuide.preferredWords.join(", ") : "None specified"}
- Words/Phrases to Avoid or Ban: ${styleGuide.avoidWords.length > 0 ? styleGuide.avoidWords.join(", ") : "None specified"}
- Sentence Structure: Max target sentence length is ${styleGuide.maxSentenceLength} words. Preferred voice: ${styleGuide.voice}.
- Grammar & Conventions: Oxford comma: ${styleGuide.oxfordComma ? "Required" : "Disallowed"}. Contractions: ${styleGuide.contractions}. Target Point of View: ${styleGuide.pointOfView}.
- Custom Instructions: ${styleGuide.customRules || "None"}

USER'S DOCUMENT TO AUDIT:
"""
${text}
"""

Evaluate the document thoroughly against every single rule. Flag specific deviations where the user's text breaches the style guide. For every deviation, provide the EXACT verbatim snippet from the document, explain why it deviates, and suggest an exact rewrite that fixes it while preserving the author's intent.

Return your evaluation in valid JSON matching this schema:
{
  "overallScore": number (0 to 100),
  "grade": "Excellent" | "Good" | "Needs Attention" | "Requires Revision",
  "summary": string (editorial overview of voice, consistency, and alignment),
  "categoryScores": {
    "tone": number (0-100),
    "vocabulary": number (0-100),
    "sentenceStructure": number (0-100),
    "grammar": number (0-100)
  },
  "deviations": [
    {
      "id": string (unique e.g. "dev-1"),
      "originalSnippet": string (exact verbatim text substring from the document),
      "category": "tone" | "vocabulary" | "sentenceStructure" | "grammar" | "custom",
      "ruleName": string (short rule title e.g. "Banned Word Usage", "Passive Voice", "Excessive Sentence Length"),
      "severity": "violation" | "warning" | "suggestion",
      "explanation": string (why this violates the guideline),
      "suggestedReplacement": string (ready-to-replace rewrite)
    }
  ],
  "strengths": [string] (3-4 points of what the author did exceptionally well)
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          grade: { type: Type.STRING },
          summary: { type: Type.STRING },
          categoryScores: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.NUMBER },
              vocabulary: { type: Type.NUMBER },
              sentenceStructure: { type: Type.NUMBER },
              grammar: { type: Type.NUMBER },
            },
            required: ["tone", "vocabulary", "sentenceStructure", "grammar"],
          },
          deviations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                originalSnippet: { type: Type.STRING },
                category: { type: Type.STRING },
                ruleName: { type: Type.STRING },
                severity: { type: Type.STRING },
                explanation: { type: Type.STRING },
                suggestedReplacement: { type: Type.STRING },
              },
              required: ["id", "originalSnippet", "category", "ruleName", "severity", "explanation", "suggestedReplacement"],
            },
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["overallScore", "grade", "summary", "categoryScores", "deviations", "strengths"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}") as StyleGuideAnalysisResult;
  return parsed;
}

/**
 * Analyze narrative storytelling arc and structural pacing
 */
export async function analyzeStoryArc(
  text: string,
  frameworkId: string = "freytag"
): Promise<StoryArcAnalysisResult> {
  const ai = getAI();

  const frameworkDescriptions: Record<string, string> = {
    freytag: "Freytag's Dramatic Pyramid: Exposition, Inciting Incident, Rising Action, Climax, Falling Action, Resolution/Denouement",
    three_act: "Three-Act Structure: Act 1 (Hook & Inciting Incident & Plot Point 1), Act 2A (Rising Complications), Midpoint (Major Shift), Act 2B (All Hope Lost / Crisis), Act 3 (Climax & Resolution)",
    heros_journey: "The Hero's Journey: Ordinary World & Call to Adventure, Crossing the Threshold, Tests & Allies, The Ordeal (Supreme Crisis), The Reward & Road Back, Resurrection & Return with Elixir",
    fichtean_curve: "Fichtean Curve: Immediate Action / Hook, Escalating Series of Crises, Master Climax, Rapid Resolution",
  };

  const frameworkName =
    frameworkId === "three_act"
      ? "Three-Act Structure"
      : frameworkId === "heros_journey"
      ? "The Hero's Journey"
      : frameworkId === "fichtean_curve"
      ? "Fichtean Curve"
      : "Freytag's Pyramid";

  const frameworkDetail = frameworkDescriptions[frameworkId] || frameworkDescriptions.freytag;

  const prompt = `You are a master literary theorist and story editor.
Analyze the user's creative or narrative writing against the following narrative framework:
FRAMEWORK: ${frameworkName}
DEFINITION: ${frameworkDetail}

USER'S DRAFT:
"""
${text}
"""

Map the user's text onto the stages of this storytelling arc.
Analyze:
1. Which parts of the draft correspond to which narrative stages.
2. How emotional tension and narrative stakes ebb and flow (0 to 100).
3. Identify narrative pacing gaps, underdeveloped stages (e.g. rushed climax, missing resolution, lack of stakes in rising action), or overextended passages.
4. For each stage, evaluate detected tension vs ideal tension, provide constructive editorial suggestions, and write a concrete draft expansion snippet that the author could incorporate.
5. Create a 7 to 10 point tension curve trajectory across the document percentage (0% to 100%).

Return in valid JSON matching this schema:
{
  "frameworkId": "${frameworkId}",
  "frameworkName": "${frameworkName}",
  "pacingScore": number (0 to 100),
  "overallNarrativeDiagnosis": string (comprehensive structural critique of flow and narrative impact),
  "stages": [
    {
      "stageId": string (e.g. "stage-1"),
      "name": string (stage name, e.g. "Exposition", "Inciting Incident", "Rising Action", "Climax", "Falling Action", "Resolution"),
      "description": string (purpose of this stage in the chosen structure),
      "idealTension": number (0 to 100),
      "detectedTension": number (0 to 100),
      "status": "strong" | "developing" | "missing" | "rushed" | "overextended",
      "matchedExcerpt": string or null (verbatim quote or summary of where this beat occurs in the draft, or null if missing),
      "analysis": string (detailed critique of how this stage functions in the draft),
      "suggestions": string (actionable advice to elevate impact, tension, or flow),
      "expansionSnippet": string (a high-quality prose paragraph that could be added to develop this stage)
    }
  ],
  "tensionCurve": [
    {
      "positionPct": number (0 to 100, e.g. 0, 15, 30, 50, 70, 85, 100),
      "idealTension": number (0 to 100),
      "detectedTension": number (0 to 100),
      "stageName": string,
      "note": string (short beat summary)
    }
  ],
  "strengths": [string],
  "priorityRevisions": [
    {
      "title": string,
      "stageName": string,
      "advice": string,
      "draftAddition": string
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          frameworkId: { type: Type.STRING },
          frameworkName: { type: Type.STRING },
          pacingScore: { type: Type.NUMBER },
          overallNarrativeDiagnosis: { type: Type.STRING },
          stages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stageId: { type: Type.STRING },
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                idealTension: { type: Type.NUMBER },
                detectedTension: { type: Type.NUMBER },
                status: { type: Type.STRING },
                matchedExcerpt: { type: Type.STRING, nullable: true },
                analysis: { type: Type.STRING },
                suggestions: { type: Type.STRING },
                expansionSnippet: { type: Type.STRING },
              },
              required: ["stageId", "name", "description", "idealTension", "detectedTension", "status", "analysis", "suggestions", "expansionSnippet"],
            },
          },
          tensionCurve: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                positionPct: { type: Type.NUMBER },
                idealTension: { type: Type.NUMBER },
                detectedTension: { type: Type.NUMBER },
                stageName: { type: Type.STRING },
                note: { type: Type.STRING },
              },
              required: ["positionPct", "idealTension", "detectedTension", "stageName", "note"],
            },
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          priorityRevisions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                stageName: { type: Type.STRING },
                advice: { type: Type.STRING },
                draftAddition: { type: Type.STRING },
              },
              required: ["title", "stageName", "advice", "draftAddition"],
            },
          },
        },
        required: ["frameworkId", "frameworkName", "pacingScore", "overallNarrativeDiagnosis", "stages", "tensionCurve", "strengths", "priorityRevisions"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}") as StoryArcAnalysisResult;
  return parsed;
}

/**
 * Assistant tool for expanding or weaving content
 */
export async function expandOrWeave(
  promptContext: string,
  mode: "weave_research" | "expand_beat" | "polish_style",
  currentText: string,
  additionalData?: string
): Promise<{ text: string }> {
  const ai = getAI();

  let systemPrompt = "";
  if (mode === "weave_research") {
    systemPrompt = `You are an expert creative editor. Weave the provided research snippet naturally into the current draft paragraph. Make sure the tone is seamless, authentic, and evocative.`;
  } else if (mode === "expand_beat") {
    systemPrompt = `You are a master author. Expand this narrative beat to deepen tension, emotional resonance, sensory detail, and character introspection.`;
  } else {
    systemPrompt = `You are an elite copy editor. Polish and rewrite the selected text to adhere strictly to the requested style and rhythm.`;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `${systemPrompt}\n\nContext/Instructions: ${promptContext}\n\nCurrent Text:\n"""\n${currentText}\n"""\n${additionalData ? `Additional Research/Style Info:\n${additionalData}` : ""}\n\nProvide the refined prose directly without conversational meta-commentary:`,
  });

  return { text: (response.text || "").trim() };
}

/**
 * Analyze reference writing sample to extract unique stylistic fingerprint
 */
export async function analyzeStyleFingerprint(
  referenceText: string,
  name?: string,
  sourceDescription?: string
): Promise<StyleFingerprint> {
  const ai = getAI();

  const prompt = `You are a world-class literary linguist, stylometry analyst, and master editor.
Analyze the following reference text or writing sample to extract its exact, idiosyncratic stylistic fingerprint:

REFERENCE SAMPLE:
"""
${referenceText}
"""

Perform a deep forensic analysis of the unique stylistic elements:
1. TONE: Register, emotional temperature, narrative distance, irony vs sincerity, prevailing atmospheric mood.
2. SENTENCE STRUCTURE & SYNTAX: Average sentence length (in words), syntactic complexity, structural cadence, dominant syntax patterns (e.g., parataxis, polysyndeton, chiasmus, periodic sentences, fragments), punctuation idiosyncrasies (em-dashes, semicolons, sparse commas, parentheticals).
3. VOCABULARY & DICTION: Lexical register, favorite descriptors, characteristic phrasing patterns, specific words/motifs to emulate, words/clichés this style strictly avoids, sensory modalities prioritized (visual, acoustic, tactile, olfactory).
4. RHYTHM & PROSODY: Tempo, sentence length variance (e.g. staccato punchy sentences mixed with long rolling cadences), sonic textures (alliteration, hard consonants, assonance, monosyllabic beats), musicality.
5. EMULATION SYSTEM PROMPT: A rich, highly specific set of instructions that another AI model can use as a system instruction to write indistinguishably in this exact voice.
6. QUANTITATIVE METRICS (0-100 integers):
   - sentencePacing: 0 (ultra-short staccato) to 100 (epic periodic sprawl)
   - lexicalDensity: 0 (plain vernacular) to 100 (ornate/academic/baroque)
   - emotionalHeat: 0 (glacial detachment) to 100 (fervent emotionality)
   - sensoryTexture: 0 (abstract cerebral) to 100 (visceral tactile immersion)
   - rhythmVariability: 0 (metronomic uniformity) to 100 (wild syncopation)

Return your response in valid JSON matching this schema:
{
  "id": "voice-${Date.now()}",
  "name": "${name ? name.replace(/"/g, '\\"') : "Identified Voice"}",
  "sourceDescription": "${sourceDescription ? sourceDescription.replace(/"/g, '\\"') : "Analyzed from reference text"}",
  "analyzedAt": "${new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}",
  "sampleExcerpt": "${referenceText.slice(0, 180).replace(/\n/g, " ").replace(/"/g, '\\"')}...",
  "overallVoiceSummary": string (1-2 sentences capturing the essence of the voice),
  "tone": {
    "primaryTone": string,
    "emotionalDistance": string,
    "ironyLevel": "sincere" | "mildly_ironic" | "satirical" | "detached",
    "moodAtmosphere": string
  },
  "sentenceStructure": {
    "averageLengthWords": number,
    "complexity": "simple_staccato" | "compound_balanced" | "periodic_complex" | "stream_of_consciousness" | "varied_orchestrated",
    "dominantSyntaxPatterns": [string],
    "punctuationHabits": [string],
    "structuralCadenceNotes": string
  },
  "vocabulary": {
    "register": "informal" | "conversational" | "literary" | "academic" | "archaic_poetic",
    "favoriteDescriptors": [string],
    "characteristicPhrasing": [string],
    "wordsToEmulate": [string],
    "wordsOrClichésToAvoid": [string],
    "sensoryPreference": string
  },
  "rhythm": {
    "tempo": "rapid_punchy" | "measured_steady" | "languid_flowing" | "syncopated_dynamic",
    "musicalityDescription": string,
    "sentenceLengthVariance": "uniform" | "moderately_varied" | "dramatically_contrasting",
    "sonicTextures": [string]
  },
  "emulationSystemPrompt": string,
  "metrics": {
    "sentencePacing": number,
    "lexicalDensity": number,
    "emotionalHeat": number,
    "sensoryTexture": number,
    "rhythmVariability": number
  }
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          sourceDescription: { type: Type.STRING },
          analyzedAt: { type: Type.STRING },
          sampleExcerpt: { type: Type.STRING },
          overallVoiceSummary: { type: Type.STRING },
          tone: {
            type: Type.OBJECT,
            properties: {
              primaryTone: { type: Type.STRING },
              emotionalDistance: { type: Type.STRING },
              ironyLevel: { type: Type.STRING },
              moodAtmosphere: { type: Type.STRING },
            },
            required: ["primaryTone", "emotionalDistance", "ironyLevel", "moodAtmosphere"],
          },
          sentenceStructure: {
            type: Type.OBJECT,
            properties: {
              averageLengthWords: { type: Type.NUMBER },
              complexity: { type: Type.STRING },
              dominantSyntaxPatterns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              punctuationHabits: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              structuralCadenceNotes: { type: Type.STRING },
            },
            required: [
              "averageLengthWords",
              "complexity",
              "dominantSyntaxPatterns",
              "punctuationHabits",
              "structuralCadenceNotes",
            ],
          },
          vocabulary: {
            type: Type.OBJECT,
            properties: {
              register: { type: Type.STRING },
              favoriteDescriptors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              characteristicPhrasing: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              wordsToEmulate: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              wordsOrClichésToAvoid: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sensoryPreference: { type: Type.STRING },
            },
            required: [
              "register",
              "favoriteDescriptors",
              "characteristicPhrasing",
              "wordsToEmulate",
              "wordsOrClichésToAvoid",
              "sensoryPreference",
            ],
          },
          rhythm: {
            type: Type.OBJECT,
            properties: {
              tempo: { type: Type.STRING },
              musicalityDescription: { type: Type.STRING },
              sentenceLengthVariance: { type: Type.STRING },
              sonicTextures: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              "tempo",
              "musicalityDescription",
              "sentenceLengthVariance",
              "sonicTextures",
            ],
          },
          emulationSystemPrompt: { type: Type.STRING },
          metrics: {
            type: Type.OBJECT,
            properties: {
              sentencePacing: { type: Type.NUMBER },
              lexicalDensity: { type: Type.NUMBER },
              emotionalHeat: { type: Type.NUMBER },
              sensoryTexture: { type: Type.NUMBER },
              rhythmVariability: { type: Type.NUMBER },
            },
            required: [
              "sentencePacing",
              "lexicalDensity",
              "emotionalHeat",
              "sensoryTexture",
              "rhythmVariability",
            ],
          },
        },
        required: [
          "id",
          "name",
          "sourceDescription",
          "analyzedAt",
          "sampleExcerpt",
          "overallVoiceSummary",
          "tone",
          "sentenceStructure",
          "vocabulary",
          "rhythm",
          "emulationSystemPrompt",
          "metrics",
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}") as StyleFingerprint;
  // Ensure ID and fallback names if not provided
  if (!parsed.id) parsed.id = `voice-${Date.now()}`;
  if (!parsed.name || parsed.name === "Identified Voice") {
    parsed.name = name || "Extracted Style Profile";
  }
  if (!parsed.sourceDescription) {
    parsed.sourceDescription = sourceDescription || "Reference text analysis";
  }
  return parsed;
}

/**
 * Emulate the identified style to generate or revise text
 */
export async function emulateStyleGeneration(
  request: EmulateGenerationRequest
): Promise<EmulateGenerationResult> {
  const ai = getAI();
  const { styleFingerprint, action, textToRewrite, contextText, userPrompt } = request;

  let taskInstruction = "";
  if (action === "rewrite") {
    taskInstruction = `TASK: REVISE AND REWRITE TEXT IN THE IDENTIFIED STYLE
You must rewrite the following user text so it embodies the stylistic elements of this voice (tone, sentence structure, vocabulary, and rhythm), while preserving all core facts, narrative events, or logical arguments.

ORIGINAL TEXT TO REWRITE:
"""
${textToRewrite}
"""
${contextText ? `DOCUMENT CONTEXT / SURROUNDING TEXT:\n"""\n${contextText.slice(0, 1000)}\n"""` : ""}`;
  } else if (action === "continue") {
    taskInstruction = `TASK: SEAMLESSLY CONTINUE WRITING IN THE IDENTIFIED STYLE
Continue the user's manuscript from where it leaves off. Adopt the identified voice's sentence rhythms, vocabulary choices, tonal distance, and atmospheric texture so that the transition is completely invisible and organic.

EXISTING MANUSCRIPT SO FAR:
"""
${contextText || textToRewrite || ""}
"""
${userPrompt ? `SPECIFIC DIRECTION FOR THIS CONTINUATION:\n"${userPrompt}"` : "Continue the narrative flow or argument naturally for 2 to 3 paragraphs."}`;
  } else {
    taskInstruction = `TASK: GENERATE NEW TEXT FROM PROMPT IN THE IDENTIFIED STYLE
Generate a new passage or scene following the user's prompt, fully channeling the identified voice's tone, syntax, rhythm, and vocabulary.

USER PROMPT:
"${userPrompt}"
${contextText ? `OVERALL DOCUMENT CONTEXT:\n"""\n${contextText.slice(0, 800)}\n"""` : ""}`;
  }

  const prompt = `You are an author possessing chameleon-like mastery of literary and prose style.
You must generate or revise text so that it meticulously emulates the following identified stylistic profile:

================== IDENTIFIED STYLE FINGERPRINT ==================
VOICE NAME: ${styleFingerprint.name}
OVERALL ESSENCE: ${styleFingerprint.overallVoiceSummary}

1. TONE & ATMOSPHERE:
- Primary Tone: ${styleFingerprint.tone.primaryTone}
- Emotional Distance: ${styleFingerprint.tone.emotionalDistance}
- Irony / Stance: ${styleFingerprint.tone.ironyLevel}
- Mood / Atmosphere: ${styleFingerprint.tone.moodAtmosphere}

2. SENTENCE STRUCTURE & SYNTAX:
- Target Average Sentence Length: ~${styleFingerprint.sentenceStructure.averageLengthWords} words
- Complexity Type: ${styleFingerprint.sentenceStructure.complexity}
- Dominant Syntax Patterns: ${styleFingerprint.sentenceStructure.dominantSyntaxPatterns.join("; ")}
- Punctuation Habits: ${styleFingerprint.sentenceStructure.punctuationHabits.join("; ")}
- Cadence Notes: ${styleFingerprint.sentenceStructure.structuralCadenceNotes}

3. VOCABULARY & DICTION:
- Lexical Register: ${styleFingerprint.vocabulary.register}
- Signature Words to Prioritize: ${styleFingerprint.vocabulary.wordsToEmulate.join(", ")}
- Words/Clichés Strictly Avoided: ${styleFingerprint.vocabulary.wordsOrClichésToAvoid.join(", ")}
- Sensory Modalities: ${styleFingerprint.vocabulary.sensoryPreference}

4. RHYTHM & PROSODY:
- Tempo: ${styleFingerprint.rhythm.tempo}
- Musicality: ${styleFingerprint.rhythm.musicalityDescription}
- Sentence Length Variance: ${styleFingerprint.rhythm.sentenceLengthVariance}
- Sonic Textures: ${styleFingerprint.rhythm.sonicTextures.join(", ")}

SPECIFIC EMULATION DIRECTIVES:
${styleFingerprint.emulationSystemPrompt}
==================================================================

${taskInstruction}

Deliver your output in valid JSON matching this schema:
{
  "generatedText": string (the beautifully written, stylistically emulated prose ready for insertion),
  "explanation": {
    "toneAdopted": string (how the tone and emotional distance were enacted),
    "rhythmTechniquesUsed": string (how the sentence length variance and prosody were constructed),
    "vocabularyChoices": [string] (key specific words or phrasings selected to match the profile),
    "sentenceStructureAdjustments": string (how syntax, punctuation, or clause lengths were tuned)
  }
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          generatedText: { type: Type.STRING },
          explanation: {
            type: Type.OBJECT,
            properties: {
              toneAdopted: { type: Type.STRING },
              rhythmTechniquesUsed: { type: Type.STRING },
              vocabularyChoices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sentenceStructureAdjustments: { type: Type.STRING },
            },
            required: [
              "toneAdopted",
              "rhythmTechniquesUsed",
              "vocabularyChoices",
              "sentenceStructureAdjustments",
            ],
          },
        },
        required: ["generatedText", "explanation"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}") as EmulateGenerationResult;
  if (textToRewrite) {
    parsed.originalText = textToRewrite;
  }
  return parsed;
}

export interface MoodRewriteResponse {
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
}

/**
 * Analyze a document section's current mood and generate tone-matched rewriting suggestions
 * heightened to match the author's intended mood tag.
 */
export async function analyzeAndRewriteMood(
  textSnippet: string,
  moodTag: string,
  moodName: string,
  customIntent?: string,
  documentContext?: string
): Promise<MoodRewriteResponse> {
  const ai = getAI();

  const prompt = `You are a master literary editor and prose stylist specializing in affective narrative tone and sensory mood modulation.

The author has tagged a section of their manuscript with an INTENDED MOOD:
- Target Mood: "${moodName}" (Tag ID: ${moodTag})
${customIntent ? `- Author's Specific Creative Intent: "${customIntent}"` : ""}

MANUSCRIPT SECTION TO ANALYZE & REWRITE:
"""
${textSnippet}
"""

${documentContext ? `SURROUNDING DOCUMENT CONTEXT:\n"""\n${documentContext.slice(0, 1000)}\n"""\n` : ""}

YOUR TASKS:
1. Current Mood Assessment:
   - Diagnose the current emotional tone, atmosphere, and sensory presence of this snippet.
   - Calculate how closely it currently aligns with the target mood "${moodName}" (0 to 100%).
   - Explain what is working and what is falling flat or creating tonal dissonance.

2. Generate 3 Distinct Tone-Matched Rewriting Suggestions:
   - Each suggestion must preserve the core narrative facts, character motivations, and dialogue meaning from the original snippet.
   - Radically modulate the syntax, sensory imagery (sound, texture, light, visceral bodily reactions), pacing/rhythm, and word choices to powerfully evoke the intended mood ("${moodName}").
   - Variation 1: Direct & Visceral (immediate sensory impact, tight cadence).
   - Variation 2: Atmospheric & Psychological (introspective resonance, evocative cadence).
   - Variation 3: Stylized & Rhythmic (dynamic sentence length variance, acoustic textures).
   - For each suggestion, provide an alignment score (90-99%) and a concrete explanation of the specific literary techniques employed (e.g. staccato clauses, cold metallic descriptors, breathlessness, slowing of perceptual time).

Return valid JSON conforming to this schema:
{
  "currentMoodAnalysis": {
    "detectedMood": string,
    "alignmentScore": number (0-100),
    "critique": string
  },
  "suggestions": [
    {
      "id": string (e.g. "sug-1"),
      "title": string (e.g. "Visceral Dread & Staccato Cadence"),
      "rewrittenText": string (the complete rewritten passage ready to insert),
      "alignmentScore": number (0-100),
      "techniqueExplanation": string
    }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          currentMoodAnalysis: {
            type: Type.OBJECT,
            properties: {
              detectedMood: { type: Type.STRING },
              alignmentScore: { type: Type.NUMBER },
              critique: { type: Type.STRING },
            },
            required: ["detectedMood", "alignmentScore", "critique"],
          },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                rewrittenText: { type: Type.STRING },
                alignmentScore: { type: Type.NUMBER },
                techniqueExplanation: { type: Type.STRING },
              },
              required: ["id", "title", "rewrittenText", "alignmentScore", "techniqueExplanation"],
            },
          },
        },
        required: ["currentMoodAnalysis", "suggestions"],
      },
    },
  });

  const parsed = JSON.parse(response.text || "{}") as MoodRewriteResponse;
  return parsed;
}

