export type Language = 'en' | 'bs';

export interface RevenueStream {
  id: string;
  name: { en: string; bs: string };
  difficulty: { en: string; bs: string }; // e.g., Very Low / Vrlo nisko
  timeTo100: { en: string; bs: string }; // e.g., 3-5 days / 3-5 dana
  scalability: { en: string; bs: string }; // e.g., $5,000+/mo
  techBarrierScore: number; // 1-10 (lower is easier)
  speedScore: number; // 1-10 (higher is faster)
  scalabilityScore: number; // 1-10 (higher is better)
  overallScore: number;
  isWinner?: boolean;
  description: { en: string; bs: string };
  pros: { en: string[]; bs: string[] };
  cons: { en: string[]; bs: string[] };
  targetClients: { en: string; bs: string };
}

export interface ToolRequirement {
  name: string;
  role: { en: string; bs: string };
  cost: { en: string; bs: string };
  freeTierLimit: { en: string; bs: string };
  url: string;
  badge: string;
}

export interface AIPromptItem {
  id: string;
  title: { en: string; bs: string };
  toolTarget: string; // e.g. "Make.com OpenAI / Gemini Node"
  purpose: { en: string; bs: string };
  promptText: { en: string; bs: string };
  inputsNeeded: { en: string[]; bs: string[] };
}

export interface ScriptItem {
  id: string;
  channel: { en: string; bs: string };
  title: { en: string; bs: string };
  subject?: { en: string; bs: string };
  body: { en: string; bs: string };
  tips: { en: string; bs: string };
}

export interface WorkflowNode {
  step: number;
  title: { en: string; bs: string };
  tool: string;
  action: { en: string; bs: string };
  details: { en: string; bs: string };
}

export interface ChecklistItem {
  id: string;
  day: number;
  title: { en: string; bs: string };
  description: { en: string; bs: string };
  completed: boolean;
}

export interface HermesImprovement {
  id: string;
  number: number;
  title: { en: string; bs: string };
  category: 'tool-calling' | 'data-validation' | 'memory' | 'guardrails' | 'error-handling' | 'architecture';
  summary: { en: string; bs: string };
  technicalDetail: { en: string; bs: string };
  codeOrSchema: string;
  impact: { en: string; bs: string };
}

