import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { runDomainScan } from "@/lib/scan/scan-service";
import { checkAndCreateAlerts } from "@/lib/alerts/check-alerts";
import { logActivity } from "@/lib/activity-logger";

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
      .select("*")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { count: promptCount } = await supabaseAdmin
      .from("prompts")
      .select("*", { count: "exact", head: true })
      .eq("domain_id", domainId)
      .eq("is_active", true);

    if (!promptCount || promptCount === 0) {
      return NextResponse.json(
        { error: "Add at least one prompt before scanning" },
        { status: 400 }
      );
    }

    logActivity({ userId: user.id, action: "scan.start", resourceType: "domain", resourceId: domainId });

    const { analyses, progress } = await runDomainScan(domainId);

    const mentioned = analyses.filter((a: { brandMentioned: boolean }) => a.brandMentioned).length;
    const alertsCount = await checkAndCreateAlerts(domainId).catch(() => 0);

    logActivity({ userId: user.id, action: "scan.complete", resourceType: "domain", resourceId: domainId, metadata: { total: analyses.length, mentioned } });

    return NextResponse.json({
      success: true,
      totalAnalyses: analyses.length,
      mentioned,
      mentionRate: analyses.length > 0 ? Math.round((mentioned / analyses.length) * 100) : 0,
      newAlerts: alertsCount,
      errors: progress.errors,
    });
  } catch (err) {
    console.error("Scan error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Scan failed" },
      { status: 500 }
    );
  }
}
