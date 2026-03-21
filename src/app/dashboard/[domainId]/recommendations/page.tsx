import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { RecommendationsList } from "@/components/dashboard/recommendations-list";
import { Lightbulb } from "lucide-react";

export default async function RecommendationsPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const { data: rawDomain } = await supabaseAdmin
    .from("domains")
    .select("id")
    .eq("id", domainId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!rawDomain) notFound();

  const { data: rawRecommendations } = await supabaseAdmin
    .from("recommendations")
    .select("*")
    .eq("domain_id", domainId)
    .order("status", { ascending: true })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: false });

  const recommendations = (rawRecommendations || []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    status: r.status,
    createdAt: r.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recommendations</h1>
          <p className="text-sm text-muted-foreground">
            AI-generated suggestions to improve your brand visibility.
          </p>
        </div>
      </div>
      <RecommendationsList recommendations={recommendations} domainId={domainId} />
    </div>
  );
}
