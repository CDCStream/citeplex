import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getDefaultBlogAuthor } from "@/lib/blog-brand";
import { verifyOutrankWebhook } from "@/lib/webhook-verify";
import { normalizeArticlesFromPayload } from "@/lib/outrank-normalize";
import { pingSearchEngines } from "@/lib/sitemap-ping";

export const maxDuration = 60;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const challenge =
    url.searchParams.get("challenge") ??
    url.searchParams.get("hub.challenge");
  if (challenge !== null && challenge !== "") {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.json({ status: "ok" });
}

export async function POST(request: Request) {
  const secret = process.env.OUTRANK_WEBHOOK_SECRET;
  if (!verifyOutrankWebhook(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  let payload: unknown;

  const rawText = await request.text();
  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch {
    payload = { _raw: rawText };
  }

  const articles = normalizeArticlesFromPayload(payload);

  if (articles.length === 0) {
    const slug = `debug-webhook-${Date.now()}`;
    const content = `<pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre>`;
    await supabase.from("blog_posts").insert({
      slug,
      title: "Outrank webhook debug",
      description: "No articles parsed; raw payload stored.",
      content,
      author: getDefaultBlogAuthor(),
      image: null,
      tags: [] as string[],
      status: "draft",
      published_at: null,
      updated_at: new Date().toISOString(),
    });

    await pingSearchEngines().catch(() => undefined);

    return NextResponse.json({
      ok: true,
      inserted: 0,
      debugSlug: slug,
      message: "No articles parsed; debug draft created.",
    });
  }

  const rows = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    content: a.content,
    author: a.author,
    image: a.image,
    tags: a.tags,
    status: "published" as const,
    published_at: a.published_at,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("blog_posts").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 },
    );
  }

  await pingSearchEngines().catch(() => undefined);

  return NextResponse.json({
    ok: true,
    upserted: rows.length,
    slugs: rows.map((r) => r.slug),
  });
}
