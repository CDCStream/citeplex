import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendVerificationCode } from "@/lib/email";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/:#?]/)[0];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { domainUrl, email } = await req.json();

    if (!domainUrl || !email) {
      return NextResponse.json({ error: "Domain URL and email are required" }, { status: 400 });
    }

    const urlDomain = extractDomain(domainUrl);
    const emailDomain = email.split("@")[1]?.toLowerCase();

    if (!emailDomain || emailDomain !== urlDomain) {
      return NextResponse.json(
        { error: "Email domain must match the website domain" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch { /* server component context */ }
          },
        },
      }
    );

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sixtySecondsAgo = new Date(Date.now() - 60_000).toISOString();
    const { data: recentSend } = await supabaseAdmin
      .from("domain_verifications")
      .select("id")
      .eq("user_id", authUser.id)
      .eq("email", email.toLowerCase())
      .gte("created_at", sixtySecondsAgo)
      .is("verified_at", null)
      .limit(1)
      .maybeSingle();

    if (recentSend) {
      return NextResponse.json(
        { error: "Please wait 60 seconds before requesting a new code" },
        { status: 429 }
      );
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await supabaseAdmin.from("domain_verifications").insert({
      user_id: authUser.id,
      domain_url: domainUrl,
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt,
    });

    await sendVerificationCode(email.toLowerCase(), code, domainUrl);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[SendVerification] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to send verification code" },
      { status: 500 }
    );
  }
}
