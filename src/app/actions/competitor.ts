"use server";

import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { runSingleCompetitorScan } from "@/lib/scan/scan-service";
import { logActivity } from "@/lib/activity-logger";

export async function createCompetitor(domainId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!domain) throw new Error("Domain not found");

  const url = formData.get("url") as string;
  const brandName = formData.get("brandName") as string;

  if (!url || !brandName) throw new Error("URL and brand name are required");

  const { data: competitor, error } = await supabaseAdmin
    .from("competitors")
    .insert({
      domain_id: domainId,
      url: url.trim(),
      brand_name: brandName.trim(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  logActivity({ userId: user.id, action: "competitor.create", resourceType: "competitor", resourceId: competitor.id, metadata: { brand_name: competitor.brand_name, url: competitor.url, domain_id: domainId } });

  revalidatePath(`/dashboard/${domainId}/competitors`);

  runSingleCompetitorScan(domainId, competitor.id).catch((err) => {
    console.error("Auto-scan for new competitor failed:", err);
  });
}

export async function deleteCompetitor(competitorId: string, domainId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: competitor } = await supabaseAdmin
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .maybeSingle();
  if (!competitor) throw new Error("Competitor not found");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("user_id")
    .eq("id", competitor.domain_id)
    .single();
  if (!domain || domain.user_id !== user.id) throw new Error("Competitor not found");

  await supabaseAdmin.from("competitors").delete().eq("id", competitorId);

  logActivity({ userId: user.id, action: "competitor.delete", resourceType: "competitor", resourceId: competitorId, metadata: { brand_name: competitor.brand_name, domain_id: domainId } });

  revalidatePath(`/dashboard/${domainId}/competitors`);
}
