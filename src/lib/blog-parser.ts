import type { BlogPostRow, ParsedBlogPost } from "@/types/blog";
import { getDefaultBlogAuthor } from "@/lib/blog-brand";
import {
  extractRawArticles,
  normalizeArticle,
} from "@/lib/outrank-normalize";

/** Supabase/PostgREST may return tags as string[] or occasionally a single string / JSON. */
export function normalizeTags(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t)).filter(Boolean);
  }
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s.startsWith("[") || s.startsWith("{")) {
      try {
        const parsed = JSON.parse(s) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((t) => String(t)).filter(Boolean);
        }
      } catch {
        /* fall through */
      }
    }
    return s.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tryParseJsonFromContent(content: string): unknown | null {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  }
  const pre = trimmed.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (pre) {
    const inner = decodeHtmlEntities(pre[1].trim());
    try {
      return JSON.parse(inner);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Normalize a DB row for rendering. If content holds a debug JSON payload, extract the first article.
 */
export function parseBlogPost(row: BlogPostRow): ParsedBlogPost {
  let content = row.content ?? "";
  const title = row.title ?? "Untitled";
  const description = row.description ?? null;
  let author = row.author ?? getDefaultBlogAuthor();
  let image = row.image ?? null;
  let tags = normalizeTags(row.tags as unknown);
  let publishedAt = row.published_at ?? null;

  const looksDebug =
    content.includes("debug-webhook") ||
    content.includes("<pre") ||
    /^[\s]*\{/.test(content.trim());

  if (looksDebug) {
    const parsed = tryParseJsonFromContent(content);
    if (parsed !== null) {
      const rawArticles = extractRawArticles(parsed);
      const first = rawArticles[0];
      const normalized = normalizeArticle(first);
      if (normalized) {
        content = normalized.content;
        return {
          slug: row.slug,
          title: normalized.title || title,
          description: normalized.description ?? description,
          content,
          author: normalized.author || author,
          image: normalized.image ?? image,
          tags: normalized.tags.length
          ? normalizeTags(normalized.tags)
          : tags,
          published_at: normalized.published_at ?? publishedAt,
        };
      }
    }
  }

  return {
    slug: row.slug,
    title,
    description,
    content,
    author,
    image,
    tags,
    published_at: publishedAt,
  };
}
