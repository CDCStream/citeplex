"use server";

import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity-logger";

export async function createDomain(formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const url = formData.get("url") as string;
  const brandName = formData.get("brandName") as string;
  const industry = (formData.get("industry") as string) || null;
  const description = (formData.get("description") as string) || null;

  if (!url || !brandName) throw new Error("URL and brand name are required");

  const { data: domain, error } = await supabaseAdmin
    .from("domains")
    .insert({
      user_id: user.id,
      url: url.trim(),
      brand_name: brandName.trim(),
      industry: industry?.trim(),
      description: description?.trim(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  logActivity({ userId: user.id, action: "domain.create", resourceType: "domain", resourceId: domain.id, metadata: { brand_name: domain.brand_name, url: domain.url } });

  revalidatePath("/dashboard");
  redirect(`/dashboard/${domain.id}`);
}

export async function updateDomain(domainId: string, formData: FormData) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!domain) throw new Error("Domain not found");

  await supabaseAdmin
    .from("domains")
    .update({
      url: (formData.get("url") as string)?.trim(),
      brand_name: (formData.get("brandName") as string)?.trim(),
      industry: (formData.get("industry") as string)?.trim() || null,
      description: (formData.get("description") as string)?.trim() || null,
    })
    .eq("id", domainId);

  logActivity({ userId: user.id, action: "domain.update", resourceType: "domain", resourceId: domainId });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${domainId}`);
}

export async function deleteDomain(domainId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!domain) throw new Error("Domain not found");

  await supabaseAdmin.from("domains").delete().eq("id", domainId);

  logActivity({ userId: user.id, action: "domain.delete", resourceType: "domain", resourceId: domainId, metadata: { brand_name: domain.brand_name, url: domain.url } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
