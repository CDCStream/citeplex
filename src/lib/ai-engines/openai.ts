import type { AiEngine, AiQueryResult } from "./types";

export class ChatGPTEngine implements AiEngine {
  name = "chatgpt" as const;

  private parseResponse(data: Record<string, unknown>): string {
    const output = data.output as { type: string; content?: { type?: string; text?: string }[] }[] | undefined;
    if (!output) return "";
    return (
      output
        .filter((item) => item.type === "message")
        .map((item) =>
          item.content?.map((c) => c.text ?? "").join("") ?? ""
        )
        .join("\n")
        .trim()
    );
  }

  async query(prompt: string): Promise<AiQueryResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { engine: this.name, response: "", error: "OPENAI_API_KEY not set" };

    // Attempt 1: with web search
    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          tools: [{ type: "web_search_preview" }],
          input: prompt,
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = this.parseResponse(data);
        if (text) {
          return {
            engine: this.name,
            response: text,
            inputTokens: data.usage?.input_tokens,
            outputTokens: data.usage?.output_tokens,
          };
        }
      } else {
        const errorBody = await res.text();
        console.error(`[ChatGPT] web_search attempt failed ${res.status}: ${errorBody.slice(0, 200)}`);
      }
    } catch (err) {
      console.error(`[ChatGPT] web_search attempt error:`, (err as Error).message);
    }

    // Attempt 2: without web search (fallback)
    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: prompt,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return { engine: this.name, response: "", error: `OpenAI ${res.status}: ${errorBody.slice(0, 200)}` };
      }

      const data = await res.json();
      const text = this.parseResponse(data);

      return {
        engine: this.name,
        response: text,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      };
    } catch (err) {
      return { engine: this.name, response: "", error: `OpenAI error: ${(err as Error).message}` };
    }
  }
}
