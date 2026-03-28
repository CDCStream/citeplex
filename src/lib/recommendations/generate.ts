import { supabaseAdmin } from "@/lib/supabase/server";
import { callLLM } from "@/lib/llm/client";

type Priority = "high" | "medium" | "low";

interface RawRecommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export async function generateRecommendations(domainId: string): Promise<number> {
  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("brand_name, url, industry")
    .eq("id", domainId)
    .single();

  if (!domain) return 0;

  const { data: latestScanRow } = await supabaseAdmin
    .from("scan_results")
    .select("scanned_at")
    .eq("domain_id", domainId)
    .order("scanned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestScanRow) return 0;

  const batchStart = new Date(new Date(latestScanRow.scanned_at).getTime() - 60 * 60 * 1000);

  const { data: resultRows } = await supabaseAdmin
    .from("scan_results")
    .select("id, prompt_id, ai_engine, brand_mentioned, position")
    .eq("domain_id", domainId)
    .gte("scanned_at", batchStart.toISOString());

  const rawResults = resultRows ?? [];
  if (rawResults.length === 0) return 0;

  const promptIds = [...new Set(rawResults.map((r) => r.prompt_id))];
  const { data: promptRows } = await supabaseAdmin
    .from("prompts")
    .select("id, text")
    .in("id", promptIds);

  const promptMap: Record<string, string> = {};
  for (const p of promptRows ?? []) {
    promptMap[p.id] = p.text;
  }

  const results = rawResults.map((r) => ({
    aiEngine: r.ai_engine,
    brandMentioned: r.brand_mentioned,
    position: r.position,
    promptText: promptMap[r.prompt_id] ?? "",
  }));

  const mentionedPrompts = results
    .filter((r) => r.brandMentioned)
    .map((r) => `✅ "${r.promptText}" on ${r.aiEngine}${r.position ? ` (position #${r.position})` : ""}`)
    .slice(0, 15);

  const missedPrompts = results
    .filter((r) => !r.brandMentioned)
    .map((r) => `❌ "${r.promptText}" on ${r.aiEngine}`)
    .slice(0, 15);

  const totalRuns = results.length;
  const mentionedRuns = results.filter((r) => r.brandMentioned).length;
  const mentionRate = Math.round((mentionedRuns / totalRuns) * 100);

  try {
    const content = await callLLM({
      chain: "fast",
      system: "You are an AI Search Visibility expert. Respond ONLY with a valid JSON array, no other text.",
      user: `Analyze these scan results and provide 3-5 specific, actionable recommendations.

Brand: ${domain.brand_name}
Website: ${domain.url}
Industry: ${domain.industry || "Not specified"}
Mention Rate: ${mentionRate}% (${mentionedRuns}/${totalRuns} responses mention the brand)

Prompts where brand WAS mentioned:
${mentionedPrompts.join("\n") || "None"}

Prompts where brand was NOT mentioned:
${missedPrompts.join("\n") || "None — brand appeared everywhere!"}

Provide exactly 3-5 recommendations as a JSON array. Each item must have:
- "title": short action title (max 60 chars)
- "description": specific, actionable explanation with concrete steps (2-3 sentences)
- "priority": "high", "medium", or "low"

Focus on:
1. Content gaps — what topics to create content about
2. Technical SEO — structured data, citations, authority signals
3. AI-specific optimization — how to get cited by AI engines

Respond ONLY with a valid JSON array, no other text.`,
      maxTokens: 1000,
      temperature: 0.7,
      timeout: 30000,
    });

    const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const recommendations: RawRecommendation[] = JSON.parse(jsonStr);

    if (!Array.isArray(recommendations)) return 0;

    await supabaseAdmin
      .from("recommendations")
      .delete()
      .eq("domain_id", domainId)
      .eq("status", "pending");

    let count = 0;
    for (const rec of recommendations.slice(0, 5)) {
      if (!rec.title || !rec.description) continue;

      const priority: Priority =
        rec.priority === "high" ? "high" : rec.priority === "low" ? "low" : "medium";

      await supabaseAdmin.from("recommendations").insert({
        domain_id: domainId,
        title: rec.title.slice(0, 100),
        description: rec.description,
        priority,
      });
      count++;
    }

    return count;
  } catch {
    console.error("Failed to generate recommendations");
    return 0;
  }
}
