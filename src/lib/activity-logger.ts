import { supabaseAdmin } from "@/lib/supabase/server";

interface ActivityLog {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export function logActivity(log: ActivityLog) {
  if (!log.userId) return;

  (async () => {
    try {
      const { count } = await supabaseAdmin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("id", log.userId!);

      if (!count || count === 0) return;

      const { error } = await supabaseAdmin.from("user_activities").insert({
        user_id: log.userId,
        action: log.action,
        resource_type: log.resourceType ?? null,
        resource_id: log.resourceId ?? null,
        metadata: log.metadata ?? {},
      });

      if (error) console.error("[ActivityLog] Failed:", error.message);
    } catch (e) {
      console.error("[ActivityLog] Failed:", e);
    }
  })();
}
