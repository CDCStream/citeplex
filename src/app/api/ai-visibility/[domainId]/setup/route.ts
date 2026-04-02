import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runDomainScan } from "@/lib/scan/scan-service";
import { logActivity } from "@/lib/activity-logger";
import { getEffectivePromptLimit } from "@/lib/prompt-limits";

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

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id, user_id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { prompts } = await req.json();
    if (!prompts?.length) {
      return NextResponse.json(
        { error: "At least one prompt is required" },
        { status: 400 }
      );
    }

    const plan = user.plan;
    if (!plan) {
      return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
    }
    const limit = await getEffectivePromptLimit(user.id, plan);

    const { data: userDomains } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("user_id", user.id);
    const domainIds = userDomains?.map((d) => d.id) || [];

    let currentUsed = 0;
    if (domainIds.length > 0) {
      const { count } = await supabaseAdmin
        .from("prompts")
        .select("id", { count: "exact", head: true })
        .in("domain_id", domainIds);
      currentUsed = count || 0;
    }

    const allowedCount = Math.min(prompts.length, limit - currentUsed);
    if (allowedCount <= 0) {
      return NextResponse.json(
        { error: "Prompt limit reached" },
        { status: 400 }
      );
    }

    const promptRows = prompts
      .slice(0, allowedCount)
      .map(
        (p: {
          text: string;
          category?: string;
          language?: string;
          country?: string;
        }) => ({
          domain_id: domainId,
          text: p.text,
          category: p.category || null,
          language: p.language || null,
          country: p.country || null,
          is_active: true,
        })
      );

    await supabaseAdmin.from("prompts").insert(promptRows);

    logActivity({
      userId: user.id,
      action: "ai_visibility.setup",
      resourceType: "domain",
      resourceId: domainId,
      metadata: { prompts_added: allowedCount },
    });

    after(async () => {
      try {
        await runDomainScan(domainId);
      } catch (err) {
        console.error("Initial AI visibility scan error:", err);
      }
    });

    return NextResponse.json({ ok: true, promptsAdded: allowedCount });
  } catch (err) {
    console.error("AI visibility setup error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Setup failed" },
      { status: 500 }
    );
  }
}
