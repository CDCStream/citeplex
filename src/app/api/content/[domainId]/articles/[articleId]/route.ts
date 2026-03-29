import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: { params: Promise<{ domainId: string; articleId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId, articleId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.metaDescription !== undefined)
      updates.meta_description = body.metaDescription;
    if (body.coverImage !== undefined) updates.cover_image = body.coverImage;
    if (body.content !== undefined) {
      updates.content = body.content;
      const stripped = (body.content as string).replace(/<[^>]+>/g, " ");
      updates.word_count = stripped
        .split(/\s+/)
        .filter((w: string) => w.length > 0).length;
    }
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.status !== undefined) updates.status = body.status;

    const { error } = await supabaseAdmin
      .from("articles")
      .update(updates)
      .eq("id", articleId)
      .eq("domain_id", domainId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Article update error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ domainId: string; articleId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId, articleId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from("articles")
      .delete()
      .eq("id", articleId)
      .eq("domain_id", domainId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Article delete error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to delete" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: { params: Promise<{ domainId: string; articleId: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domainId, articleId } = await params;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const { data: article } = await supabaseAdmin
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .eq("domain_id", domainId)
      .maybeSingle();

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ article });
  } catch (err) {
    console.error("Article get error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to get article" },
      { status: 500 }
    );
  }
}
