import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { domainUrl, email, code } = await req.json();

    if (!domainUrl || !email || !code) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
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

    const { data: verification } = await supabaseAdmin
      .from("domain_verifications")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("domain_url", domainUrl)
      .eq("email", email.toLowerCase())
      .is("verified_at", null)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!verification) {
      return NextResponse.json(
        { error: "No valid verification found. Please request a new code." },
        { status: 400 }
      );
    }

    if (verification.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      );
    }

    if (verification.code !== code.trim()) {
      await supabaseAdmin
        .from("domain_verifications")
        .update({ attempts: verification.attempts + 1 })
        .eq("id", verification.id);

      const remaining = MAX_ATTEMPTS - verification.attempts - 1;
      return NextResponse.json(
        { error: `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.` },
        { status: 400 }
      );
    }

    await supabaseAdmin
      .from("domain_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);

    return NextResponse.json({ success: true, verified: true });
  } catch (err) {
    console.error("[VerifyCode] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Verification failed" },
      { status: 500 }
    );
  }
}
