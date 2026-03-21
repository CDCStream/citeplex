import type { AiEngine, AiQueryResult } from "./types";

const SYSTEM_PROMPT = `You are a product recommendation assistant. Always list specific brand names with their website URLs. Use a numbered list format: "1. BrandName - https://example.com". Keep descriptions brief (one sentence max).`;

export class ClaudeEngine implements AiEngine {
  name = "claude" as const;

  async query(prompt: string): Promise<AiQueryResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { engine: this.name, response: "", error: "ANTHROPIC_API_KEY not set" };

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return { engine: this.name, response: "", error: `Claude ${res.status}: ${errorBody}` };
      }

      const data = await res.json();
      const text =
        data.content
          ?.filter((block: { type: string }) => block.type === "text")
          .map((block: { text: string }) => block.text)
          .join("") ?? "";

      return {
        engine: this.name,
        response: text,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      };
    } catch (err) {
      return { engine: this.name, response: "", error: `Claude error: ${(err as Error).message}` };
    }
  }
}
