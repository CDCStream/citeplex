import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ domainId: string }> }
) {
  const { domainId } = await params;

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("scan_status, last_scan_started_at")
    .eq("id", domainId)
    .single();

  if (!domain) {
    return NextResponse.json({ status: "idle", progress: null });
  }

  const { count: activePromptCount } = await supabaseAdmin
    .from("prompts")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .eq("is_active", true);

  const ENGINES = 7;
  const total = (activePromptCount ?? 0) * ENGINES;

  if (total === 0 || !domain.last_scan_started_at) {
    return NextResponse.json({ status: domain.scan_status, progress: null });
  }

  const { count: completedScans } = await supabaseAdmin
    .from("scan_results")
    .select("*", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .gte("scanned_at", domain.last_scan_started_at);

  const completed = Math.min(completedScans ?? 0, total);

  return NextResponse.json({
    status: domain.scan_status,
    progress: { completed, total },
  });
}
