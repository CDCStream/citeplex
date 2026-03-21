import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: rawDomains } = await supabaseAdmin
    .from("domains")
    .select("id, brand_name, url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const domains = (rawDomains || []).map((d) => ({
    id: d.id,
    brandName: d.brand_name,
    url: d.url,
  }));

  return (
    <DashboardShell
      user={{ name: user.name, email: user.email, image: user.image }}
      domains={domains}
    >
      {children}
    </DashboardShell>
  );
}
