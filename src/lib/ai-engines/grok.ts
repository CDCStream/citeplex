import type { AiEngine, AiQueryResult } from "./types";

export class GrokEngine implements AiEngine {
  name = "grok" as const;

  async query(prompt: string): Promise<AiQueryResult> {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { engine: this.name, response: "", error: "XAI_API_KEY not set" };

    try {
      const res = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "grok-4-fast-non-reasoning",
          tools: [{ type: "web_search" }],
          input: [
            {
              role: "system",
              content: "You are a helpful search assistant. Search the web and provide detailed, factual answers with specific brand names, product names, and website URLs when relevant.",
            },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return { engine: this.name, response: "", error: `Grok ${res.status}: ${errorBody}` };
      }

      const data = await res.json();

      const text = data.output
        ?.filter((item: { type: string }) => item.type === "message")
        .map((item: { content: { text: string }[] }) =>
          item.content?.map((c: { text: string }) => c.text).join("")
        )
        .join("\n") ?? "";

      return {
        engine: this.name,
        response: text,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      };
    } catch (err) {
      return { engine: this.name, response: "", error: `Grok error: ${(err as Error).message}` };
    }
  }
}
