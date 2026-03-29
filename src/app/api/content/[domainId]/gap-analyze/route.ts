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
      .select("id, brand_name, url, description, industry, primary_country, user_id")
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

    const analysis = await analyzeGapAndPlan(
      prompt.trim(),
      domain.brand_name,
      domain.url,
      domain.industry || "",
      compList,
      country,
    );

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Gap analysis error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Gap analysis failed" },
      { status: 500 }
    );
  }
}
