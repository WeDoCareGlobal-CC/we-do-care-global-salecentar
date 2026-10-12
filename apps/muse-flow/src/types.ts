export interface DocumentDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  wordCount: number;
  readingTimeMinutes: number;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ResearchSnippet {
  title: string;
  snippet: string;
  sourceTitle?: string;
  sourceUrl?: string;
  context: string;
}

export interface ResearchData {
  query: string;
  url?: string;
  summary: string;
  keySnippets: ResearchSnippet[];
  keyTakeaways: string[];
  groundingSources: GroundingSource[];
  readyToInsertParagraph: string;
  timestamp: string;
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
  idealTension: number;
  detectedTension: number;
  status: "strong" | "developing" | "missing" | "rushed" | "overextended";
  matchedExcerpt: string | null;
  analysis: string;
  suggestions: string;
  expansionSnippet: string;
}

export interface TensionPoint {
  positionPct: number;
  idealTension: number;
  detectedTension: number;
  stageName: string;
  note: string;
}

export interface StoryArcAnalysisResult {
  frameworkId: string;
  frameworkName: string;
  pacingScore: number;
  overallNarrativeDiagnosis: string;
  stages: ArcStage[];
  tensionCurve: TensionPoint[];
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

export type ActiveToolTab = "research" | "style_guide" | "story_arc" | "voice_emulator" | "mood_annotator";

export type ThemeMode = "light" | "dark";

export interface MoodTagDefinition {
  id: string;
  name: string;
  iconName: string;
  colorClass: string;
  darkColorClass: string;
  badgeBg: string;
  badgeText: string;
  hex: string;
  description: string;
  sensoryFocus: string;
  cadenceRecommendation: string;
}

export interface MoodRewriteSuggestion {
  id: string;
  title: string;
  rewrittenText: string;
  alignmentScore: number;
  techniqueExplanation: string;
}

export interface MoodAnnotation {
  id: string;
  textSnippet: string;
  startIndex?: number;
  endIndex?: number;
  moodTag: string;
  moodName: string;
  customIntent?: string;
  createdAt: string;
  currentMoodAnalysis?: {
    detectedMood: string;
    alignmentScore: number;
    critique: string;
  };
  suggestions?: MoodRewriteSuggestion[];
  status?: "pending" | "analyzed" | "applied";
}

export const MOOD_TAG_PRESETS: MoodTagDefinition[] = [
  {
    id: "suspenseful",
    name: "Suspenseful & Tense",
    iconName: "Eye",
    colorClass: "amber-500",
    darkColorClass: "amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-950/80 border-amber-300 dark:border-amber-700",
    badgeText: "text-amber-900 dark:text-amber-200",
    hex: "#f59e0b",
    description: "Lingering threat, breathless pacing, heightened sensory vigilance, and delayed revelations.",
    sensoryFocus: "Micro-acoustics (ticking, rustling, uneven breathing), cold physical sensations, shadows.",
    cadenceRecommendation: "Short paratactic clauses alternating with held breaths; deliberate withholding of resolution.",
  },
  {
    id: "melancholic",
    name: "Melancholic & Yearning",
    iconName: "CloudRain",
    colorClass: "blue-500",
    darkColorClass: "blue-400",
    badgeBg: "bg-blue-100 dark:bg-blue-950/80 border-blue-300 dark:border-blue-700",
    badgeText: "text-blue-900 dark:text-blue-200",
    hex: "#3b82f6",
    description: "Gentle sorrow, aching nostalgia, quiet interiority, and the lingering weight of absence.",
    sensoryFocus: "Dull filtered light, rain-slick stone, cold tea, fading photographs, muted acoustics.",
    cadenceRecommendation: "Languid rolling rhythms, gentle periodic sentences, soft consonant textures.",
  },
  {
    id: "ominous",
    name: "Ominous & Foreboding",
    iconName: "Flame",
    colorClass: "rose-600",
    darkColorClass: "rose-400",
    badgeBg: "bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-700",
    badgeText: "text-rose-900 dark:text-rose-200",
    hex: "#e11d48",
    description: "Looming catastrophe, suffocating weight, subtle dread, and predatory stillness.",
    sensoryFocus: "Smell of ozone or damp earth, heavy barometric pressure, jagged silhouettes.",
    cadenceRecommendation: "Monosyllabic beats, sudden harsh stops, ominous repetitions.",
  },
  {
    id: "ethereal",
    name: "Ethereal & Dreamlike",
    iconName: "Sparkles",
    colorClass: "purple-500",
    darkColorClass: "purple-400",
    badgeBg: "bg-purple-100 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700",
    badgeText: "text-purple-900 dark:text-purple-200",
    hex: "#a855f7",
    description: "Dissolved boundaries, luminous shimmer, surreal transcendence, and floating perception.",
    sensoryFocus: "Prismatic refractions, phosphorescence, ambient harmonics, gossamer textures.",
    cadenceRecommendation: "Fluid stream-of-consciousness, undulating rhythmic cadences, soft sibilance.",
  },
  {
    id: "whimsical",
    name: "Whimsical & Playful",
    iconName: "Smile",
    colorClass: "emerald-500",
    darkColorClass: "emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700",
    badgeText: "text-emerald-900 dark:text-emerald-200",
    hex: "#10b981",
    description: "Buoyant curiosity, delightful idiosyncrasies, witty observations, and kinetic charm.",
    sensoryFocus: "Bright colors, popping sounds, crisp confection textures, sudden kinetic movements.",
    cadenceRecommendation: "Bouncing metric cadence, surprising compound adjectives, witty parentheticals.",
  },
  {
    id: "visceral",
    name: "Visceral & Raw",
    iconName: "Zap",
    colorClass: "orange-600",
    darkColorClass: "orange-400",
    badgeBg: "bg-orange-100 dark:bg-orange-950/80 border-orange-300 dark:border-orange-700",
    badgeText: "text-orange-900 dark:text-orange-200",
    hex: "#ea580c",
    description: "Unfiltered bodily immediacy, grit, bone-deep impact, and physical reality stripped bare.",
    sensoryFocus: "Acre taste of copper, gravel scraping skin, burning lungs, pulsing blood in temples.",
    cadenceRecommendation: "Pounding monosyllables, harsh consonants (k, t, p), abrupt telegraphic clauses.",
  },
  {
    id: "intimate",
    name: "Intimate & Tender",
    iconName: "Heart",
    colorClass: "pink-500",
    darkColorClass: "pink-400",
    badgeBg: "bg-pink-100 dark:bg-pink-950/80 border-pink-300 dark:border-pink-700",
    badgeText: "text-pink-900 dark:text-pink-200",
    hex: "#ec4899",
    description: "Whispered proximity, fragile vulnerability, shared secret silence, and emotional warmth.",
    sensoryFocus: "Warm skin, shallow breath against the ear, soft cotton, eyelashes, fragile touch.",
    cadenceRecommendation: "Gentle whispered phrases, soft pauses, delicate syntactic intimacy.",
  },
  {
    id: "triumphant",
    name: "Triumphant & Exultant",
    iconName: "Sun",
    colorClass: "yellow-600",
    darkColorClass: "yellow-400",
    badgeBg: "bg-yellow-100 dark:bg-yellow-950/80 border-yellow-300 dark:border-yellow-700",
    badgeText: "text-yellow-900 dark:text-yellow-200",
    hex: "#ca8a04",
    description: "Soaring breakthrough, expansive horizons, heart-swelling catharsis, and earned glory.",
    sensoryFocus: "Golden blinding sunlight, rushing wind, ringing bells, reverberating applause.",
    cadenceRecommendation: "Crescendo sentence architecture, expansive cumulative clauses, heroic rhythm.",
  },
  {
    id: "nostalgic",
    name: "Nostalgic & Bittersweet",
    iconName: "Clock",
    colorClass: "stone-500",
    darkColorClass: "stone-400",
    badgeBg: "bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700",
    badgeText: "text-stone-800 dark:text-stone-200",
    hex: "#78716c",
    description: "The golden patina of memory, cherished relics, and the quiet ache of time passed.",
    sensoryFocus: "Old book pages, woodsmoke on wool sweaters, dried lavender, summer dusk dust.",
    cadenceRecommendation: "Reflective cadence, tender retrospective clauses, lingering rhythmic closes.",
  },
  {
    id: "satirical",
    name: "Sharp & Satirical",
    iconName: "Zap",
    colorClass: "cyan-600",
    darkColorClass: "cyan-400",
    badgeBg: "bg-cyan-100 dark:bg-cyan-950/80 border-cyan-300 dark:border-cyan-700",
    badgeText: "text-cyan-900 dark:text-cyan-200",
    hex: "#0891b2",
    description: "Incisive irony, surgical societal mockery, deadpan exaggeration, and witty bite.",
    sensoryFocus: "Gleaming polished silverware, sterile corporate elevators, over-tailored suits.",
    cadenceRecommendation: "Crisp antithesis, razor-sharp periodic punchlines, faux-solemn cadences.",
  },
];

export interface ReferenceStyleSample {
  id: string;
  authorOrStyle: string;
  description: string;
  text: string;
}

export const REFERENCE_STYLE_SAMPLES: ReferenceStyleSample[] = [
  {
    id: "hemingway",
    authorOrStyle: "Ernest Hemingway",
    description: "Sparse, staccato, declarative syntax, sensory physical precision, parataxis",
    text: `In the late summer of that year we lived in a house in a village that looked across the river and the plain to the mountains. In the bed of the river there were pebbles and boulders, dry and white in the sun, and the water was clear and swiftly moving and blue in the channels. Troops went by the house and down the road and the dust they raised powdered the leaves of the trees. The trunks of the trees too were dusty and the leaves fell early that year and we saw the troops marching along the road and the dust rising and leaves, stirred by the breeze, falling and the soldiers marching and afterward the road bare and white except for the leaves.`,
  },
  {
    id: "didion",
    authorOrStyle: "Joan Didion",
    description: "Cool, clinical detachment, rhythmic clauses, diagnostic social observation",
    text: `We tell ourselves stories in order to live. The princess is caged in the consulate. The man with the candy will lead the children into the sea. The naked leg on the highway is a tragedy, or it is a random detail of California life. We look for the sermon in the suicide, for the social or moral lesson in the murder of five. We interpret what we see, select the most workable of the multiple choices. We live entirely, especially if we are writers, by the imposition of a narrative line upon disparate images, by the 'ideas' with which we have learned to freeze the shifting phantasmagoria which is our actual experience.`,
  },
  {
    id: "mccarthy",
    authorOrStyle: "Cormac McCarthy",
    description: "Biblical cadence, polysyndeton, archaic visceral lexicon, desolate grandeur",
    text: `They rode on and the sun in the east flushed pale through the dusty band of haze that lay along the desert rim. The horsemen rode in a scatter across the gray limestone plain and their shadows went long before them like figures of men cut from dark paper. The land was barren and dry and the mountains stood like iron teeth against the white sky. He looked at the boy riding beside him, his face wrapped in a gray scarf against the alkali dust, his eyes small and fierce in the shadow of his hat. They spoke no words because words were heavy and cold like lead shot in a dry pouch.`,
  },
  {
    id: "woolf",
    authorOrStyle: "Virginia Woolf",
    description: "Stream of consciousness, luminous sensory cadence, fluid temporal shifts",
    text: `What a lark! What a plunge! For so it had always seemed to her, when, with a little squeak of the hinges, which she could hear now, she had burst open the French windows and plunged at Bourton into the open air. How fresh, how calm, stiller than this of course, the air was in the early morning; like the flap of a wave; the kiss of a wave; chill and sharp and yet (for a girl of eighteen as she then was) solemn, feeling as she did, standing there at the open window, that something awful was about to happen; looking at the flowers, at the trees with the smoke winding off them and the rooks rising, falling.`,
  },
  {
    id: "chandler",
    authorOrStyle: "Raymond Chandler (Noir)",
    description: "Cynical urban wit, hard-boiled similes, razor-sharp rhythm, atmospheric gloom",
    text: `It was about eleven o'clock in the morning, mid October, with the sun not shining and a look of hard wet rain in the clearness of the foothills. I was wearing my powder-blue suit, with dark blue shirt, tie and display handkerchief, black brogues, black wool socks with dark blue clocks on them. I was neat, clean, shaved and sober, and I didn't care who knew it. I was everything the well-dressed private detective ought to be. I was calling on four million dollars. The main hallway of the Sternwood house was two stories high and smelled like an old bank vault.`,
  },
  {
    id: "thompson",
    authorOrStyle: "Hunter S. Thompson (Gonzo)",
    description: "High-velocity kinetic rush, hyperbole, satirical edge, manic momentum",
    text: `We were somewhere around Barstow on the edge of the desert when the drugs began to take hold. I remember saying something like 'I feel a bit lightheaded; maybe you should drive...' And suddenly there was a terrible roar all around us and the sky was full of what looked like huge bats, all swooping and screeching and diving around the car, which was going about a hundred miles an hour with the top down to Las Vegas. And a voice was screaming: 'Holy Jesus! What are these goddamn animals?'`,
  },
];

export const DEFAULT_STYLE_PRESETS: Record<string, StyleGuideConfig> = {
  literary: {
    name: "Literary & Atmospheric",
    tone: "Evocative, introspective, immersive, and sensory-rich",
    preferredWords: ["luminous", "resonance", "ephemeral", "shadows", "murmur", "cadence"],
    avoidWords: ["basically", "very", "utilize", "impactful", "literally", "synergy", "paradigm"],
    maxSentenceLength: 32,
    voice: "flexible",
    oxfordComma: true,
    contractions: "allowed",
    pointOfView: "third",
    customRules: "Emphasize evocative sensory imagery (scent, texture, ambient acoustics). Avoid clichés and mechanical dialogue tags.",
  },
  journalistic: {
    name: "Crisp & Punchy Journalism",
    tone: "Objective, dynamic, punchy, and lucid",
    preferredWords: ["reveals", "confirmed", "critical", "notably", "signaled", "pivotal"],
    avoidWords: ["in order to", "needless to say", "very", "extremely", "at the end of the day", "delve", "tapestry"],
    maxSentenceLength: 22,
    voice: "active",
    oxfordComma: true,
    contractions: "avoid",
    pointOfView: "third",
    customRules: "Lead with the most vital discovery or thesis. Every paragraph must advance the story without throat-clearing fluff.",
  },
  thought_leadership: {
    name: "Executive Thought Leadership",
    tone: "Authoritative, forward-looking, persuasive, and clear",
    preferredWords: ["first-principles", "trajectory", "strategic", "inflection point", "architecture", "frontier"],
    avoidWords: ["game-changer", "supercharge", "silver bullet", "disruptive", "buzzword", "synergize"],
    maxSentenceLength: 26,
    voice: "active",
    oxfordComma: true,
    contractions: "allowed",
    pointOfView: "first",
    customRules: "Ground claims in empirical examples or strategic observations. Formulate unambiguous assertions rather than speculative hedged statements.",
  },
  creative_whimsical: {
    name: "Whimsical & Playful",
    tone: "Witty, rhythmic, imaginative, and spirited",
    preferredWords: ["curious", "peculiar", "delight", "tumble", "whimsical", "kaleidoscope"],
    avoidWords: ["furthermore", "consequently", "nevertheless", "herein", "utilize"],
    maxSentenceLength: 25,
    voice: "active",
    oxfordComma: true,
    contractions: "allowed",
    pointOfView: "first",
    customRules: "Use playful internal cadence and delightful, surprising metaphors. Keep descriptions buoyant and alive.",
  },
};

export const NARRATIVE_FRAMEWORKS = [
  {
    id: "freytag",
    name: "Freytag's Pyramid",
    subtitle: "Classic 6-part dramatic arc",
    stages: ["Exposition", "Inciting Incident", "Rising Action", "Climax", "Falling Action", "Resolution"],
    idealTensionShape: [15, 35, 65, 95, 50, 20],
  },
  {
    id: "three_act",
    name: "Three-Act Structure",
    subtitle: "Screenplay & novel standard",
    stages: ["Act I: Setup", "Plot Point 1", "Act II: Rising Stakes", "Midpoint Shift", "Act II: Dark Night", "Act III: Climax", "Resolution"],
    idealTensionShape: [20, 45, 60, 75, 55, 95, 25],
  },
  {
    id: "heros_journey",
    name: "The Hero's Journey",
    subtitle: "Monomyth quest structure",
    stages: ["Ordinary World", "Call to Adventure", "Crossing the Threshold", "Trials & Allies", "The Supreme Ordeal", "The Reward", "Return with Elixir"],
    idealTensionShape: [15, 40, 55, 70, 95, 60, 30],
  },
  {
    id: "fichtean_curve",
    name: "Fichtean Curve",
    subtitle: "Rapid crises leading to master climax",
    stages: ["Initial Hook", "Crisis One", "Crisis Two", "Crisis Three", "Master Climax", "Swift Falling Action", "Denouement"],
    idealTensionShape: [50, 65, 75, 85, 98, 40, 15],
  },
];

export const SAMPLE_DRAFTS: DocumentDraft[] = [
  {
    id: "draft-story",
    title: "The Whispering Observatory",
    updatedAt: "Just now",
    wordCount: 428,
    readingTimeMinutes: 2,
    content: `For two hundred years, the bronze dome of Mount Morwen remained bolted shut, sealed against the acidic winds of the high plateau. Elian brushed his frost-bitten fingers along the brass gearwork of the azimuth arm, listening to the hollow groan of counterweights shifting in the bedrock below.

He was not supposed to be here. The High Astrologers had declared the sky dead a generation ago, replaced by the humming luminescent grid that now blanketed every settlement in the valley. But last night, through a hairline fracture in the copper shutter, Elian had witnessed an unmistakable pulse: three quick flushes of violet light, followed by a sustained emerald beacon.

"You are wasting your remaining oxygen cartridges, boy," whispered Master Vane, stepping into the circular observation chamber with his heavy fur mantle. The elder scholar had spent thirty years pretending he was content cataloging dust particles. "The grid provides order. What lies beyond the veil is sheer entropy."

"It isn't entropy," Elian answered, his breath fogging against the frost-rimed glass of the central eyepiece. "It is syntax. Someone is signaling from the Perseus Drift."

Vane froze, his walking stick hovering an inch above the marble floor. Outside, the wind screamed against the dome's titanium ribs, rattling the ancient parabolic mirrors. The chamber trembled as a low-frequency reverberation vibrated through the limestone floorboards. Something was descending through the cloud layer, heavy and unhurried.

Elian reached for the primary wheel, wrenching the rusted brake lever clockwise. With a thunderous screech of metal parting from ice, the bronze dome split open to the night sky.

A deluge of frozen air plunged into the room, blowing oil lamps into darkness. But the darkness did not last. Overhead, where the synthetic valley grid should have reflected its dull phosphor glow, the veil was completely shattered. Millions of unmasked stars burned with cold, diamond clarity, arranged in constellations no modern imperial chart had ever dared to map.

And directly above the observatory aperture, silent as falling snow, a crystalline spire hung suspended in the stratosphere, turning like a key inside an invisible lock.`,
  },
  {
    id: "draft-essay",
    title: "The Architecture of Deep Sea Bioluminescence",
    updatedAt: "Earlier today",
    wordCount: 382,
    readingTimeMinutes: 2,
    content: `Beneath the epipelagic sunlit zone, where solar radiation attenuates to absolute zero, life does not capitulate to darkness. Instead, organisms within the bathypelagic abyss synthesize their own photons through sophisticated enzymatic luciferin-luciferase reactions, turning oceanic blackness into a dynamic communications network.

Marine biologists have utilized submersibles to study how deep-sea anglerfish and siphonophores generate living light. In organisms like the anglerfish (Melanocetus johnsonii), the luminous lure or esca is populated by symbiotic Photobacterium that cultivate sustained blue-green radiance. Because blue wavelengths possess the lowest attenuation coefficient in marine water column physics, nearly 90% of abyssal emissions peak between 470 and 490 nanometers.

Furthermore, bioluminescence serves fundamentally divergent evolutionary imperatives: predatory lure, counter-illumination camouflage against silhouettes, and sudden flashes designed to blind or confuse apex predators. The siphonophore species Praya dubia constructs bioluminescent curtains stretching dozens of meters, while lanternfish utilize ventral photophores to match downwelling moonlight.

Recent oceanic metagenomic surveys demonstrate that over 75% of deep pelagic creatures possess photometric capabilities. As human deep-sea mining expeditions prepare to dredge oceanic abyssal plains for polymetallic nodules, understanding the delicate photonic ecology of these light-emitting organisms becomes an urgent scientific priority. Disrupting these benthic habitats with sediment plumes could blind sensory networks that took millions of years to evolve.`,
  },
  {
    id: "draft-empty",
    title: "Untitled Manuscript",
    updatedAt: "New",
    wordCount: 0,
    readingTimeMinutes: 0,
    content: "",
  },
];
