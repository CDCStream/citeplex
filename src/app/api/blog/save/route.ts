import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  normalizeArticle,
  normalizeArticlesFromPayload,
} from "@/lib/outrank-normalize";
import { pingSearchEngines } from "@/lib/sitemap-ping";

export const maxDuration = 30;

export async function POST(request: Request) {
  const adminSecret = process.env.BLOG_ADMIN_SECRET?.trim();
  if (!adminSecret) {
    return NextResponse.json(
      { error: "BLOG_ADMIN_SECRET not configured" },
      { status: 503 },
    );
  }

  const header = request.headers.get("x-admin-secret");
  if (!header || header !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromList =
    typeof body === "object" && body !== null
      ? normalizeArticlesFromPayload(body)
      : [];
  const article =
    fromList[0] ??
    normalizeArticle(
      typeof body === "object" && body !== null ? body : { article: body },
    );
  if (!article) {
    return NextResponse.json(
      { error: "Could not normalize article from body" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const row = {
    slug: article.slug,
    title: article.title,
    description: article.description,
    content: article.content,
    author: article.author,
    image: article.image,
    tags: article.tags,
    status: "published" as const,
    published_at: article.published_at,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("blog_posts").upsert(row, {
    onConflict: "slug",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 },
    );
  }

  await pingSearchEngines().catch(() => undefined);

  return NextResponse.json({ ok: true, slug: article.slug });
}
