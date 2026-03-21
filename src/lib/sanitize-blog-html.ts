/**
 * Outrank HTML is trusted first-party content. We still strip scripts/event handlers.
 * `USE_PROFILES: { html: true }` can throw or over-strip in some DOMPurify/isomorphic builds;
 * we use an explicit allow-list that includes tables, images, and YouTube iframes.
 */

/** Last resort: remove active content only (trusted CMS HTML). */
function stripActiveContent(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export async function sanitizeBlogHtml(
  html: string | null | undefined,
): Promise<string> {
  const input = typeof html === "string" ? html : "";

  const blogSanitizeConfig = {
    /** Rich article HTML from Outrank */
    ADD_TAGS: ["iframe"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "src",
      "loading",
      "referrerpolicy",
      "title",
      "alt",
      "href",
      "target",
      "rel",
      "class",
      "id",
      "align",
      "colspan",
      "rowspan",
      "width",
      "height",
      "style",
    ],
    /** Keep tables, lists, semantic headings, media */
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      "caption",
      "iframe",
      "hr",
      "div",
      "span",
      "pre",
      "code",
    ],
  };

  try {
    const { default: DOMPurify } = await import("isomorphic-dompurify");
    const out = DOMPurify.sanitize(input, blogSanitizeConfig);
    if (out && out.trim().length > 0) return out;
  } catch (err) {
    console.error("[sanitizeBlogHtml] configured sanitize failed", err);
  }

  try {
    const { default: DOMPurify } = await import("isomorphic-dompurify");
    const out = DOMPurify.sanitize(input);
    if (out && out.trim().length > 0) return out;
  } catch (err) {
    console.error("[sanitizeBlogHtml] default sanitize failed", err);
  }

  try {
    const { default: DOMPurify } = await import("isomorphic-dompurify");
    return DOMPurify.sanitize(stripActiveContent(input));
  } catch (err) {
    console.error("[sanitizeBlogHtml] strip+sanitize failed", err);
  }

  /** Absolute last resort (trusted pipeline only) */
  return stripActiveContent(input);
}
