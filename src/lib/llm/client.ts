type LLMProvider = "openai" | "anthropic" | "gemini";

interface LLMConfig {
  provider: LLMProvider;
  model: string;
}

export interface CallLLMOptions {
  chain: "fast" | "strong" | LLMConfig[];
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  webSearch?: boolean;
}

const FALLBACK_CHAINS: Record<string, LLMConfig[]> = {
  fast: [
    { provider: "anthropic", model: "claude-sonnet-4-6" },
    { provider: "openai", model: "gpt-5.4" },
    { provider: "gemini", model: "gemini-2.5-flash" },
  ],
  strong: [
    { provider: "anthropic", model: "claude-opus-4-6" },
    { provider: "openai", model: "gpt-5.4" },
    { provider: "anthropic", model: "claude-sonnet-4-6" },
  ],
};

function getKey(provider: LLMProvider): string {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY || "";
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || "";
    case "gemini":
      return process.env.GOOGLE_GEMINI_API_KEY || "";
  }
}

async function callAnthropic(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
  timeout: number,
): Promise<string> {
  const key = getKey("anthropic");
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: "user", content: user }],
    }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${model} error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data.content
      ?.filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("") ?? ""
  );
}

async function callOpenAI(
  model: string,
  system: string,
  user: string,
  maxTokens: number,
  temperature: number,
  timeout: number,
  webSearch?: boolean,
): Promise<string> {
  const key = getKey("openai");
  if (!key) throw new Error("OPENAI_API_KEY not set");

  const isResponses = model.startsWith("gpt-4.1") || model.startsWith("gpt-5") || model.startsWith("o");

  if (isResponses) {
    const body: Record<string, unknown> = {
      model,
      input: [
        { role: "developer", content: system },
        { role: "user", content: user },
      ],
    };
    if (webSearch) body.tools = [{ type: "web_search_preview" }];

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI ${model} error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return (
      data.output
        ?.filter((item: { type: string }) => item.type === "message")
        .map((item: { content: { text: string }[] }) =>
          item.content?.map((c: { text: string }) => c.text).join("")
        )
        .join("\n") ?? ""
    );
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(timeout),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${model} error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callGemini(
  model: string,
  system: string,
  user: string,
  _maxTokens: number,
  _temperature: number,
  timeout: number,
): Promise<string> {
  const key = getKey("gemini");
  if (!key) throw new Error("GOOGLE_GEMINI_API_KEY not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: user }] }],
      }),
      signal: AbortSignal.timeout(timeout),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${model} error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? ""
  );
}

const PROVIDER_FN: Record<
  LLMProvider,
  (model: string, system: string, user: string, maxTokens: number, temperature: number, timeout: number, webSearch?: boolean) => Promise<string>
> = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  gemini: callGemini,
};

/**
 * Centralized LLM call with automatic 2-level fallback.
 *
 * @param opts.chain - "fast" (Sonnet 4.6 → GPT-5.4 → Gemini 2.5 Flash),
 *                     "strong" (Opus 4.6 → GPT-5.4 → Sonnet 4.6),
 *                     or a custom LLMConfig array.
 * @param opts.webSearch - If true, enables web search on providers that support it (OpenAI Responses API).
 *                         When falling back to a provider without web search, a note is appended to the user prompt.
 */
export async function callLLM(opts: CallLLMOptions): Promise<string> {
  const chain = typeof opts.chain === "string" ? FALLBACK_CHAINS[opts.chain] : opts.chain;
  const maxTokens = opts.maxTokens ?? 4096;
  const temperature = opts.temperature ?? 0.7;
  const timeout = opts.timeout ?? 120_000;
  const errors: string[] = [];

  for (let i = 0; i < chain.length; i++) {
    const cfg = chain[i];
    const fn = PROVIDER_FN[cfg.provider];
    const isLast = i === chain.length - 1;

    let userPrompt = opts.user;
    if (opts.webSearch && cfg.provider !== "openai") {
      userPrompt += "\n\n(Note: web search is not available, use your knowledge.)";
    }

    try {
      const result = await fn(
        cfg.model,
        opts.system,
        userPrompt,
        maxTokens,
        temperature,
        timeout,
        opts.webSearch,
      );
      if (i > 0) {
        console.log(`[LLM] Fallback succeeded: ${cfg.provider}/${cfg.model} (after ${i} failure${i > 1 ? "s" : ""})`);
      }
      return result;
    } catch (err) {
      const msg = (err as Error).message;
      errors.push(`${cfg.provider}/${cfg.model}: ${msg}`);
      console.error(`[LLM] ${cfg.provider}/${cfg.model} failed${isLast ? " (last)" : ", trying next fallback"}:`, msg);
    }
  }

  throw new Error(`All LLM providers failed:\n${errors.join("\n")}`);
}
