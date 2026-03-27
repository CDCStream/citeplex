import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

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

    const { title, keyword, articleType, scheduledDate } = await req.json();

    if (!title?.trim() || !scheduledDate) {
      return NextResponse.json(
        { error: "Title and date are required" },
        { status: 400 }
      );
    }

    const { data: plan, error } = await supabaseAdmin
      .from("content_plans")
      .insert({
        domain_id: domainId,
        title: title.trim(),
        keyword: keyword || null,
        article_type: articleType || null,
        scheduled_date: scheduledDate,
        status: "planned",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ plan });
  } catch (err) {
    console.error("Content plan create error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to create plan" },
      { status: 500 }
    );
  }
}

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

    const { data: plans } = await supabaseAdmin
      .from("content_plans")
      .select("*")
      .eq("domain_id", domainId)
      .order("scheduled_date", { ascending: true });

    return NextResponse.json({ plans: plans || [] });
  } catch (err) {
    console.error("Content plans list error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to list plans" },
      { status: 500 }
    );
  }
}
