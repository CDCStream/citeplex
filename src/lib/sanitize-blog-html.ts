/**
 * Load DOMPurify lazily — top-level `import "isomorphic-dompurify"` can crash
 * some serverless runtimes during module init (jsdom/window setup).
 */
export async function sanitizeBlogHtml(
  html: string | null | undefined,
): Promise<string> {
  const input = html ?? "";
  try {
    const { default: DOMPurify } = await import("isomorphic-dompurify");
    return DOMPurify.sanitize(input, { USE_PROFILES: { html: true } });
  } catch (err) {
    console.error("[sanitizeBlogHtml] primary sanitize failed", err);
    try {
      const { default: DOMPurify } = await import("isomorphic-dompurify");
      return DOMPurify.sanitize(input);
    } catch (err2) {
      console.error("[sanitizeBlogHtml] fallback failed", err2);
      return "<p>Content could not be rendered safely.</p>";
    }
  }
}
