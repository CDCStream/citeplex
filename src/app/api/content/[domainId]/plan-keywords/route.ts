import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { planKeywords } from "@/lib/content/keyword-planner";

export const maxDuration = 300;

const STALE_THRESHOLD_MS = 10 * 60 * 1000;

export async function POST(
  _req: NextRequest,
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
      .select("id, keyword_plan_status, keyword_plan_updated_at")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (domain.keyword_plan_status === "planning") {
      const updatedAt = domain.keyword_plan_updated_at ? new Date(domain.keyword_plan_updated_at).getTime() : 0;
      const isStale = Date.now() - updatedAt > STALE_THRESHOLD_MS;
      if (!isStale) {
        return NextResponse.json({ status: "already_running" });
      }
      console.log(`[KeywordPlanner] Stale planning detected for ${domainId}, restarting`);
    }

    const result = await planKeywords(domainId, 30);

    return NextResponse.json({
      status: "done",
      planned: result.planned,
    });
  } catch (err) {
    console.error("Keyword planning error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Planning failed" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
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
      .select("id, keyword_plan_status, keyword_plan_updated_at")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    let status = domain.keyword_plan_status || "none";

    if (status === "planning" && domain.keyword_plan_updated_at) {
      const elapsed = Date.now() - new Date(domain.keyword_plan_updated_at).getTime();
      if (elapsed > STALE_THRESHOLD_MS) {
        await supabaseAdmin
          .from("domains")
          .update({ keyword_plan_status: "error" })
          .eq("id", domainId);
        status = "error";
      }
    }

    return NextResponse.json({
      status,
      updatedAt: domain.keyword_plan_updated_at,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
