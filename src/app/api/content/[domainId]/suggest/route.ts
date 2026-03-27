import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

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

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ suggestions: [] });
    }

    const systemPrompt = `You are an SEO content strategist. Generate 8 article topic suggestions for a brand.
Return ONLY valid JSON array: [{"title":"...","keyword":"...","type":"guide|how-to|listicle|comparison|explainer|round-up"}]
- Each title should be specific and actionable
- Keywords should be realistic search terms
- Mix different article types
- Focus on topics that would improve AI visibility and SEO
- Avoid duplicate topics with existing planned articles`;

    const userPrompt = `Brand: ${domain.brand_name}
Description: ${domain.description || "N/A"}
Industry: ${domain.industry || "N/A"}
Competitors: ${competitorNames || "N/A"}
${existingTitles ? `Already planned: ${existingTitles}` : ""}

Generate 8 article topic suggestions.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!res.ok) {
      console.error("OpenAI suggestion error:", await res.text());
      return NextResponse.json({ suggestions: [] });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "[]";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Content suggestion error:", err);
    return NextResponse.json({ suggestions: [] });
  }
}
