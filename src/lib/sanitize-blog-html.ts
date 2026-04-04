/**
 * Outrank HTML is trusted first-party CMS content.
 * Uses `sanitize-html` (pure JS, no jsdom/WASM) to avoid ESM/CJS issues on Vercel serverless.
 */

import sanitize from "sanitize-html";

const SANITIZE_OPTIONS: sanitize.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li",
    "blockquote", "a", "img",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "iframe", "hr", "div", "span", "pre", "code",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class", "id"],
    img: ["src", "alt", "width", "height", "loading", "class", "style"],
    iframe: ["src", "allow", "allowfullscreen", "frameborder", "loading", "referrerpolicy", "title", "width", "height"],
    td: ["colspan", "rowspan", "align", "class", "style"],
    th: ["colspan", "rowspan", "align", "class", "style"],
    div: ["class", "id", "style"],
    span: ["class", "id", "style"],
    table: ["class", "style"],
    pre: ["class"],
    code: ["class"],
    h1: ["id", "class"],
    h2: ["id", "class"],
    h3: ["id", "class"],
    h4: ["id", "class"],
    h5: ["id", "class"],
    h6: ["id", "class"],
    p: ["class", "style"],
    blockquote: ["class"],
    ol: ["class", "start", "type"],
    ul: ["class"],
    li: ["class"],
  },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
  allowedSchemes: ["http", "https", "mailto"],
};

export async function sanitizeBlogHtml(
  html: string | null | undefined,
): Promise<string> {
  const input = typeof html === "string" ? html : "";
  if (!input.trim()) return "";

  let result: string;
  try {
    result = sanitize(input, SANITIZE_OPTIONS);
  } catch {
    result = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/javascript:/gi, "");
  }

  result = upgradeHttpToHttps(result);
  return result;
}

/**
 * Upgrade internal http:// links to https:// to avoid mixed-content
 * warnings and Ahrefs "HTTPS page has internal links to HTTP" issues.
 */
function upgradeHttpToHttps(html: string): string {
  return html.replace(
    /href="http:\/\/(www\.)?citeplex\.io/gi,
    'href="https://www.citeplex.io',
  );
}
