import { supabaseAdmin } from "@/lib/supabase/server";

interface IntegrationBugParams {
  domainId: string;
  userId?: string;
  platform: string;
  action: "connect_test" | "publish" | "delete";
  errorMessage: string;
  errorDetails?: Record<string, unknown>;
  articleId?: string;
}

export async function logIntegrationBug(params: IntegrationBugParams) {
  try {
    await supabaseAdmin.from("integration_bugs").insert({
      domain_id: params.domainId,
      user_id: params.userId || null,
      platform: params.platform,
      action: params.action,
      error_message: params.errorMessage,
      error_details: params.errorDetails || {},
      article_id: params.articleId || null,
    });
  } catch (err) {
    console.error("[IntegrationLogger] Failed to log bug:", err);
  }
}

/**
 * Sanitize config before logging — strip sensitive fields like passwords and tokens.
 */
export function sanitizeConfig(config: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ["password", "appPassword", "apiKey", "adminApiKey", "secret", "token", "accessToken"];
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = typeof value === "string" && value.length > 4
        ? `${value.slice(0, 4)}...`
        : "***";
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
