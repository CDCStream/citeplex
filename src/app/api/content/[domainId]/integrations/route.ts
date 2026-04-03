import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdapter } from "@/lib/content/publishers";
import { logIntegrationBug, sanitizeConfig } from "@/lib/content/integration-logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: integrations } = await supabaseAdmin
      .from("publish_integrations")
      .select("*")
      .eq("domain_id", domainId)
      .order("created_at", { ascending: true });

    return NextResponse.json({ integrations: integrations || [] });
  } catch (err) {
    console.error("Integrations list error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { platform, config } = await req.json();

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    const adapter = getAdapter(platform);
    if (!adapter) {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 }
      );
    }

    let testResult = true;
    let testError: string | null = null;
    if (Object.keys(config || {}).length > 0) {
      try {
        testResult = await adapter.test(config);
        if (!testResult) {
          testError = "Connection test returned false — check credentials";
        }
      } catch (testErr) {
        testResult = false;
        testError = (testErr as Error).message;
      }
    }

    if (!testResult && testError) {
      await logIntegrationBug({
        domainId,
        userId: user.id,
        platform,
        action: "connect_test",
        errorMessage: testError,
        errorDetails: { config: sanitizeConfig(config || {}) },
      });
    }

    const { data: integration, error } = await supabaseAdmin
      .from("publish_integrations")
      .upsert(
        {
          domain_id: domainId,
          platform,
          config: config || {},
          is_active: testResult,
        },
        { onConflict: "domain_id,platform" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      integration,
      testResult,
    });
  } catch (err) {
    console.error("Integration save error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId } = await params;
    const { platform } = await req.json();

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    await supabaseAdmin
      .from("publish_integrations")
      .delete()
      .eq("domain_id", domainId)
      .eq("platform", platform);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Integration delete error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
