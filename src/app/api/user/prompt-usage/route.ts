import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getEffectivePromptLimit, getAddonPromptCount } from "@/lib/prompt-limits";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ limit: 15, used: 0, remaining: 15, plan: "starter", addonCount: 0 });
  }

  const plan = user.plan || "starter";
  const [limit, addonCount] = await Promise.all([
    getEffectivePromptLimit(user.id, plan),
    getAddonPromptCount(user.id),
  ]);

  const { data: domains } = await supabaseAdmin
    .from("domains")
    .select("id")
    .eq("user_id", user.id);

  const domainIds = domains?.map((d) => d.id) || [];

  let used = 0;
  if (domainIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .in("domain_id", domainIds);
    used = count || 0;
  }

  return NextResponse.json({
    limit,
    used,
    remaining: Math.max(0, limit - used),
    plan,
    addonCount,
  });
}
