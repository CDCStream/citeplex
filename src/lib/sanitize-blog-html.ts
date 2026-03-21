import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize Outrank HTML for SSR. isomorphic-dompurify can throw on edge payloads — never crash the page.
 */
export function sanitizeBlogHtml(html: string | null | undefined): string {
  const input = html ?? "";
  try {
    return DOMPurify.sanitize(input, { USE_PROFILES: { html: true } });
  } catch (err) {
    console.error("[sanitizeBlogHtml] primary sanitize failed", err);
    try {
      return DOMPurify.sanitize(input);
    } catch (err2) {
      console.error("[sanitizeBlogHtml] fallback failed", err2);
      return "<p>Content could not be rendered safely. Please edit this post in the database.</p>";
    }
  }
}
