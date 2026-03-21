import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logActivity } from "@/lib/activity-logger";
import { sendWelcomeEmail } from "@/lib/email";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // ignore in Server Component context
            }
          },
        },
      },
    );

    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const isNewUser = isFirstLogin(data.user.created_at);
      const provider =
        data.user.app_metadata?.provider || "email";

      logActivity({
        action: "auth.login",
        metadata: { provider, email: data.user.email },
      });

      if (isNewUser && data.user.email) {
        const { data: dbUser } = await supabaseAdmin
          .from("users")
          .select("name")
          .eq("auth_id", data.user.id)
          .maybeSingle();

        sendWelcomeEmail(data.user.email, dbUser?.name).catch((e) =>
          console.error("[WelcomeEmail] Error:", e),
        );
      }

      const redirectUrl = new URL(next, origin);
      if (isNewUser) {
        redirectUrl.searchParams.set("welcome", "1");
      }
      return NextResponse.redirect(redirectUrl.toString());
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

function isFirstLogin(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  return diffMs < 60_000;
}
