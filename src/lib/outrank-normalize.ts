import { getDefaultBlogAuthor } from "@/lib/blog-brand";

export interface NormalizedArticle {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  author: string;
  image: string | null;
  tags: string[];
  published_at: string;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Extract raw article-like objects from arbitrary Outrank / webhook payloads. */
export function extractRawArticles(payload: unknown): unknown[] {
  if (payload === null || payload === undefined) return [];

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) return [];

  if (Array.isArray(payload.articles)) return payload.articles;

  if (payload.article !== undefined && payload.article !== null) {
    return Array.isArray(payload.article) ? payload.article : [payload.article];
  }

  if (isRecord(payload.data)) {
    const d = payload.data;
    if (Array.isArray(d.articles)) return d.articles;
    if (d.article !== undefined && d.article !== null) {
      return Array.isArray(d.article) ? d.article : [d.article];
    }
    if (Array.isArray(d)) return d;
    if (isRecord(d) && (d.title || d.content || d.html || d.body)) {
      return [d];
    }
  }

  if (Array.isArray(payload.data)) return payload.data;

  if (
    payload.title ||
    payload.content ||
    payload.html ||
    payload.body ||
    payload.headline
  ) {
    return [payload];
  }

  return [];
}

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return s || "post";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstImgSrc(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1]?.trim() ?? null;
}

function firstParagraphExcerpt(html: string, max = 280): string | null {
  const text = stripHtml(html);
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function coerceString(v: unknown): string | undefined {
  if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}

function pickTitle(obj: Record<string, unknown>): string | undefined {
  const keys = [
    "title",
    "headline",
    "name",
    "meta_title",
    "metaTitle",
    "subject",
  ] as const;
  for (const k of keys) {
    const s = coerceString(obj[k]);
    if (s) return s;
  }
  return undefined;
}

function pickContent(obj: Record<string, unknown>): string | undefined {
  const keys = [
    "content_html",
    "contentHtml",
    "html",
    "content",
    "body",
    "content_markdown",
    "contentMarkdown",
    "text",
    "article_html",
    "articleHtml",
  ] as const;
  for (const k of keys) {
    const s = coerceString(obj[k]);
    if (s) return s;
  }
  return undefined;
}

function pickSlug(obj: Record<string, unknown>): string | undefined {
  const keys = ["slug", "url_slug", "urlSlug", "permalink", "handle"] as const;
  for (const k of keys) {
    const s = coerceString(obj[k]);
    if (s) return s.replace(/^\//, "").split("/").filter(Boolean).pop() ?? s;
  }
  return undefined;
}

function pickDescription(obj: Record<string, unknown>, html: string): string | null {
  const keys = [
    "description",
    "meta_description",
    "metaDescription",
    "excerpt",
    "summary",
    "dek",
    "subtitle",
  ] as const;
  for (const k of keys) {
    const s = coerceString(obj[k]);
    if (s) return s;
  }
  return firstParagraphExcerpt(html);
}

function pickImage(obj: Record<string, unknown>, html: string): string | null {
  const keys = [
    "image",
    "image_url",
    "imageUrl",
    "featured_image",
    "featuredImage",
    "cover_image",
    "coverImage",
    "og_image",
    "ogImage",
    "thumbnail",
    "hero_image",
    "heroImage",
  ] as const;
  for (const k of keys) {
    const s = coerceString(obj[k]);
    if (s) return s;
  }
  return firstImgSrc(html);
}

function coerceTags(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x) => (typeof x === "string" ? x.trim() : String(x)))
      .filter(Boolean)
      .slice(0, 32);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 32);
  }
  if (isRecord(raw) && Array.isArray(raw.items)) {
    return coerceTags(raw.items);
  }
  return [];
}

function pickTags(obj: Record<string, unknown>, title: string, html: string): string[] {
  const tags = coerceTags(
    obj.tags ?? obj.keywords ?? obj.categories ?? obj.category,
  );
  if (tags.length) return tags;
  const fromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);
  const fromHtml = stripHtml(html)
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 5)
    .slice(0, 3);
  return [...new Set([...fromTitle, ...fromHtml])].slice(0, 8);
}

function pickPublishedAt(obj: Record<string, unknown>): string | undefined {
  const keys = [
    "published_at",
    "publishedAt",
    "published",
    "date",
    "created_at",
    "createdAt",
    "post_date",
  ] as const;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    if (typeof v === "number" && Number.isFinite(v)) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return undefined;
}

function pickAuthor(obj: Record<string, unknown>): string {
  const keys = [
    "author",
    "author_name",
    "authorName",
    "byline",
    "writer",
  ] as const;
  for (const k of keys) {
    const s = coerceString(obj[k]);
    if (s) return s;
  }
  return getDefaultBlogAuthor();
}

export function normalizeArticle(raw: unknown): NormalizedArticle | null {
  if (!isRecord(raw)) return null;
  const title = pickTitle(raw);
  const content = pickContent(raw);
  if (!title && !content) return null;

  const html = content ?? "<p></p>";
  const finalTitle = (title ?? stripHtml(html).slice(0, 120)) || "Untitled";
  let slug = pickSlug(raw);
  if (!slug) slug = slugify(finalTitle);
  slug = slugify(slug);

  const description = pickDescription(raw, html);
  const image = pickImage(raw, html);
  const tags = pickTags(raw, finalTitle, html);
  const author = pickAuthor(raw);
  const publishedAt = pickPublishedAt(raw) ?? new Date().toISOString();

  return {
    slug,
    title: finalTitle,
    description,
    content: html,
    author,
    image,
    tags,
    published_at: publishedAt,
  };
}

export function normalizeArticlesFromPayload(payload: unknown): NormalizedArticle[] {
  const rawList = extractRawArticles(payload);
  const out: NormalizedArticle[] = [];
  for (const raw of rawList) {
    const n = normalizeArticle(raw);
    if (n) out.push(n);
  }
  return out;
}
