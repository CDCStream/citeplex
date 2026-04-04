import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { callLLM } from "@/lib/llm/client";
import { safeJsonParse, extractArray } from "@/lib/content/safe-json-parse";
import { TopicSuggestionsSchema } from "@/lib/llm/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id, brand_name, description, industry")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: competitors } = await supabaseAdmin
      .from("competitors")
      .select("brand_name")
      .eq("domain_id", domainId)
      .limit(5);

    const competitorNames = (competitors || [])
      .map((c) => c.brand_name)
      .join(", ");

    const { data: existingPlans } = await supabaseAdmin
      .from("content_plans")
      .select("title")
      .eq("domain_id", domainId)
      .limit(20);

    const existingTitles = (existingPlans || [])
      .map((p) => p.title)
      .join("; ");

    const text = await callLLM({
      chain: "fast",
      expectJson: true,
      system: `You are an SEO content strategist. Generate 8 article topic suggestions for a brand.
- Each title should be specific and actionable
- Keywords should be realistic search terms
- Mix different article types
- Focus on topics that would improve AI visibility and SEO
- Avoid duplicate topics with existing planned articles`,
      user: `Brand: ${domain.brand_name}
Description: ${domain.description || "N/A"}
Industry: ${domain.industry || "N/A"}
Competitors: ${competitorNames || "N/A"}
${existingTitles ? `Already planned: ${existingTitles}` : ""}

Generate 8 article topic suggestions.`,
      temperature: 0.8,
      maxTokens: 1500,
      schema: TopicSuggestionsSchema,
      schemaName: "topic_suggestions",
    });

    const parsed = safeJsonParse<unknown>(text, "TopicSuggestions");
    const suggestions = extractArray<unknown>(parsed);

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Content suggestion error:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
