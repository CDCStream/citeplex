import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getPromptLimit } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ limit: 3, used: 0, remaining: 3, plan: "free" });
  }

  const plan = user.plan || "free";
  const limit = getPromptLimit(plan);

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
  });
}
