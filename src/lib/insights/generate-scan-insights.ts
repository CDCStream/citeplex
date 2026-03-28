import { supabaseAdmin } from "@/lib/supabase/server";
import { extractSources } from "./extract-sources";
import { getLanguageName } from "@/lib/languages";

const ANTHROPIC_API_KEY = () => process.env.ANTHROPIC_API_KEY || "";

async function callInsightLLM(prompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data.content
      ?.filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("\n") ?? ""
  );
}

export async function generateScanInsights(domainId: string) {
  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("id, brand_name, url")
    .eq("id", domainId)
    .single();

  if (!domain) return;

  const { data: latestScanRow } = await supabaseAdmin
    .from("scan_results")
    .select("scanned_at")
    .eq("domain_id", domainId)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestScanRow) return;

  const batchStart = new Date(new Date(latestScanRow.scanned_at).getTime() - 60 * 60 * 1000).toISOString();

  const { data: scanResults } = await supabaseAdmin
    .from("scan_results")
    .select("id, prompt_id, ai_engine, response, brand_mentioned, position, sentiment, citations")
    .eq("domain_id", domainId)
    .gte("scanned_at", batchStart)
    .order("scanned_at", { ascending: false });

  if (!scanResults || scanResults.length === 0) return;

  const { data: existingInsights } = await supabaseAdmin
    .from("scan_insights")
    .select("scan_result_id")
    .in("scan_result_id", scanResults.map((r) => r.id));

  const existingSet = new Set((existingInsights ?? []).map((i) => i.scan_result_id));
  const newResults = scanResults.filter((r) => !existingSet.has(r.id));

  if (newResults.length === 0) return;

  const promptIds = [...new Set(newResults.map((r) => r.prompt_id))];
  const { data: prompts } = await supabaseAdmin
    .from("prompts")
    .select("id, text, language")
    .in("id", promptIds);

  const promptMap: Record<string, { text: string; language: string | null }> = {};
  for (const p of prompts ?? []) {
    promptMap[p.id] = { text: p.text, language: p.language };
  }

  const { data: competitors } = await supabaseAdmin
    .from("competitors")
    .select("id, brand_name, url")
    .eq("domain_id", domainId);

  const competitorList = competitors ?? [];

  const resultsByPrompt: Record<string, typeof newResults> = {};
  for (const r of newResults) {
    if (!resultsByPrompt[r.prompt_id]) resultsByPrompt[r.prompt_id] = [];
    resultsByPrompt[r.prompt_id].push(r);
  }

  for (const [promptId, results] of Object.entries(resultsByPrompt)) {
    const prompt = promptMap[promptId];
    if (!prompt) continue;

    const lang = prompt.language || "en";
    const langName = getLanguageName(lang);

    await Promise.allSettled(
      results.map(async (scanResult) => {
        try {
          const sources = extractSources(
            scanResult.response,
            (scanResult.citations as string[]) ?? []
          );

          const competitorContext = competitorList.map((comp) => {
            const mentioned = scanResult.response.toLowerCase().includes(comp.brand_name.toLowerCase());
            return `  - ${comp.brand_name} (${comp.url}): ${mentioned ? "mentioned" : "not mentioned"}`;
          }).join("\n");

          const sentimentSection = scanResult.sentiment === "negative"
            ? `\n\n## Negative Sentiment Detected\nThe brand was mentioned negatively. Also explain:\n- Why was the brand mentioned negatively?\n- What specific actions can fix the negative perception?`
            : "";

          const truncatedResponse = scanResult.response.slice(0, 3000);

          const llmPrompt = `You are an AI search visibility analyst. Respond in ${langName}.

## Context
- Brand: ${domain.brand_name} (${domain.url})
- AI Engine: ${scanResult.ai_engine}
- User Query: "${prompt.text}"
- Brand mentioned: ${scanResult.brand_mentioned ? "yes" : "no"}, Position: ${scanResult.position ?? "N/A"}
- Sentiment: ${scanResult.sentiment ?? "N/A"}
- Competitors in same response:
${competitorContext || "  (none)"}

## AI Engine Response
${truncatedResponse}

## Sources Used by AI Engine
${sources.length > 0 ? sources.map((s) => `- ${s}`).join("\n") : "(no sources detected)"}

## Industry Facts
- 83% of AI citations come from 3rd party sources
- Reddit accounts for ~22% of all AI citations
- Comparison tables are preferred 78% of the time
- Original research is preferred 81% of the time
- 40-60% of sources change monthly${sentimentSection}

## Return JSON (in ${langName}):
{
  "mentionContext": "top_pick | alternative | comparison | passing_mention | not_mentioned",
  "whyMentioned": "explanation of why this engine did or did not mention the brand...",
  "sourceAnalysis": {
    "totalSources": ${sources.length},
    "brandInSources": 0,
    "competitorInSources": 0,
    "keySources": [{"url": "...", "relevance": "..."}]
  },
  "competitorComparison": "analysis of competitor positioning...",
  "recommendations": [
    {"action": "...", "reason": "...", "priority": "high|medium|low"}
  ]${scanResult.sentiment === "negative" ? `,
  "negativeMentionAnalysis": {
    "whyNegative": "...",
    "howToFix": "..."
  }` : ""}
}

Only return valid JSON, nothing else.`;

          const response = await callInsightLLM(llmPrompt);
          const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

          let insight;
          try {
            insight = JSON.parse(cleaned);
          } catch {
            insight = { whyMentioned: cleaned, mentionContext: "unknown", recommendations: [] };
          }

          await supabaseAdmin.from("scan_insights").insert({
            scan_result_id: scanResult.id,
            domain_id: domainId,
            prompt_id: promptId,
            ai_engine: scanResult.ai_engine,
            insight,
          });
        } catch (err) {
          console.error(`[Insights] Failed for scan_result ${scanResult.id}:`, err);
        }
      })
    );
  }
}
