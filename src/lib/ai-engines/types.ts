export type EngineName = "chatgpt" | "perplexity" | "gemini" | "claude" | "deepseek" | "grok" | "mistral";

export interface AiQueryResult {
  engine: EngineName;
  response: string;
  error?: string;
  inputTokens?: number;
  outputTokens?: number;
  citations?: string[];
}

export interface BrandAnalysis {
  engine: EngineName;
  response: string;
  brandMentioned: boolean;
  position: number | null;
  sentiment: "positive" | "negative" | "neutral" | null;
}

export interface AiEngine {
  name: EngineName;
  query(prompt: string): Promise<AiQueryResult>;
}
