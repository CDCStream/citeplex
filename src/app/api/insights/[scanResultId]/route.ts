import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ scanResultId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scanResultId } = await params;

    const { data: scanResult } = await supabaseAdmin
      .from("scan_results")
      .select("id, domain_id, prompt_id, ai_engine, response, brand_mentioned, position, sentiment, citations")
      .eq("id", scanResultId)
      .single();

    if (!scanResult) {
      return NextResponse.json({ error: "Scan result not found" }, { status: 404 });
    }

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("user_id")
      .eq("id", scanResult.domain_id)
      .single();

    if (!domain || domain.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: insight } = await supabaseAdmin
      .from("scan_insights")
      .select("*")
      .eq("scan_result_id", scanResultId)
      .maybeSingle();

    return NextResponse.json({
      scanResult: {
        id: scanResult.id,
        engine: scanResult.ai_engine,
        response: scanResult.response,
        brandMentioned: scanResult.brand_mentioned,
        position: scanResult.position,
        sentiment: scanResult.sentiment,
        citations: scanResult.citations,
      },
      insight: insight?.insight ?? null,
      insightId: insight?.id ?? null,
    });
  } catch (err) {
    console.error("[InsightsAPI] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to fetch insight" },
      { status: 500 }
    );
  }
}
