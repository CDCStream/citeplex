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

  Promise.resolve(
    supabaseAdmin.from("user_activities").insert({
      user_id: log.userId,
      action: log.action,
      resource_type: log.resourceType ?? null,
      resource_id: log.resourceId ?? null,
      metadata: log.metadata ?? {},
    }),
  )
    .then(({ error }) => {
      if (error) console.error("[ActivityLog] Failed:", error.message);
    })
    .catch((e: unknown) => {
      console.error("[ActivityLog] Failed:", e);
    });
}
