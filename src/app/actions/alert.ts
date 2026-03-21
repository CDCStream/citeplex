"use server";

import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAlertRead(alertId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: alert } = await supabaseAdmin
    .from("alerts")
    .select("*")
    .eq("id", alertId)
    .maybeSingle();
  if (!alert) throw new Error("Not found");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("user_id")
    .eq("id", alert.domain_id)
    .single();
  if (!domain || domain.user_id !== user.id) throw new Error("Not found");

  await supabaseAdmin
    .from("alerts")
    .update({ is_read: true })
    .eq("id", alertId);

  revalidatePath("/dashboard");
}

export async function markAllAlertsRead(domainId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!domain) throw new Error("Not found");

  await supabaseAdmin
    .from("alerts")
    .update({ is_read: true })
    .eq("domain_id", domainId)
    .eq("is_read", false);

  revalidatePath("/dashboard");
}
