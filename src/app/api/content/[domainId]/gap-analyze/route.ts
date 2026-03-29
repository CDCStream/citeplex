import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { analyzeGapAndPlan } from "@/lib/content/gap-analyzer";

export const maxDuration = 300;

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

    const { data: domain, error: domainError } = await supabaseAdmin
      .from("domains")
      .select("*")
      .eq("id", domainId)
      .maybeSingle();

    if (domainError) {
      console.error(`[GapAnalyze] Supabase error: ${domainError.message}`);
    }

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domain.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { prompt } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const { data: competitors } = await supabaseAdmin
      .from("competitors")
      .select("brand_name, url")
      .eq("domain_id", domainId);

    const compList = (competitors || []).map(c => ({
      name: c.brand_name,
      url: c.url,
    }));

    const country = (domain.primary_country || "US").toLowerCase();

    // Fetch existing article keywords so the analyzer avoids suggesting duplicates
    const { data: existingArticles } = await supabaseAdmin
      .from("articles")
      .select("target_keyword")
      .eq("domain_id", domainId);

    const existingKeywords = (existingArticles || [])
      .map(a => a.target_keyword)
      .filter(Boolean);

    const analysis = await analyzeGapAndPlan(
      prompt.trim(),
      domain.brand_name,
      domain.url,
      domain.industry || "",
      compList,
      country,
      existingKeywords,
    );

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Gap analysis error:", err);
    const raw = (err as Error).message || "";
    let userMessage = "Analysis failed. Please try again.";
    if (raw.includes("timeout") || raw.includes("aborted") || raw.includes("Aborted")) {
      userMessage = "The analysis took too long. Please try again in a moment.";
    } else if (raw.includes("All LLM providers failed")) {
      userMessage = "Our AI services are temporarily unavailable. Please try again in a few minutes.";
    }
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
