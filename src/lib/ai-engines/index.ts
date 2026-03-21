import { ChatGPTEngine } from "./openai";
import { PerplexityEngine } from "./perplexity";
import { GeminiEngine } from "./gemini";
import { ClaudeEngine } from "./claude";
import { DeepSeekEngine } from "./deepseek";
import { GrokEngine } from "./grok";
import { MistralEngine } from "./mistral";
import type { AiEngine } from "./types";

export type { AiEngine, AiQueryResult, BrandAnalysis, EngineName } from "./types";

export const engines: AiEngine[] = [
  new ChatGPTEngine(),
  new PerplexityEngine(),
  new GeminiEngine(),
  new ClaudeEngine(),
  new DeepSeekEngine(),
  new GrokEngine(),
  new MistralEngine(),
];

export function getEngine(name: string): AiEngine | undefined {
  return engines.find((e) => e.name === name);
}
