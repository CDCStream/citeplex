import { callLLM } from "@/lib/llm/client";

const USER_AGENT = "Mozilla/5.0 (compatible; Citeplex/1.0; +https://citeplex.io)";

export interface SitePage {
  url: string;
  title: string;
  description: string;
}

export interface InternalLinkResult {
  pagesFound: number;
  linksInserted: number;
  fixedContent: string | null;
}

/**
 * Crawls a site's sitemap or homepage to discover real pages,
 * then intelligently inserts internal links into the article.
 */
export async function insertInternalLinks(
  content: string,
  brandUrl: string,
  keyword: string,
  language = "English",
): Promise<InternalLinkResult> {
  try {
    const pages = await discoverSitePages(brandUrl);

    if (pages.length === 0) {
      return { pagesFound: 0, linksInserted: 0, fixedContent: null };
    }

    const pageList = pages.slice(0, 30).map((p, i) =>
      `${i + 1}. ${p.title} — ${p.url}${p.description ? ` (${p.description})` : ""}`
    ).join("\n");

    const response = await callLLM({
      chain: "fast",
      system: `You are an SEO internal linking specialist. Add internal links to an HTML article using ONLY the real site pages provided.

Rules:
- Insert 3-5 internal links naturally within the article text
- Use descriptive anchor text (not "click here" or "read more")
- Link format: <a href="[exact URL from list]">[natural anchor text]</a>
- Distribute links across different sections of the article
- Only link to pages that are genuinely relevant to the surrounding context
- Do NOT create links to pages not in the provided list
- Do NOT modify existing external links (those with target="_blank")
- Preserve ALL existing HTML structure, images, tables, formatting
- Keep everything in ${language}
- Return the COMPLETE modified HTML article`,
      user: `Add internal links from these real site pages:

${pageList}

Article keyword: "${keyword}"

Article HTML:
${content}`,
      maxTokens: 8192,
      temperature: 0.3,
      timeout: 60000,
    });

    const hasHtml = response.includes("<h2") || response.includes("<p");
    if (!hasHtml) {
      return { pagesFound: pages.length, linksInserted: 0, fixedContent: null };
    }

    const internalLinkCount = (response.match(new RegExp(`href="${escapeRegex(brandUrl)}`, "gi")) || []).length;

    return {
      pagesFound: pages.length,
      linksInserted: internalLinkCount,
      fixedContent: response.trim(),
    };
  } catch (err) {
    console.error("[InternalLinker] Failed:", (err as Error).message);
    return { pagesFound: 0, linksInserted: 0, fixedContent: null };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function discoverSitePages(brandUrl: string): Promise<SitePage[]> {
  const baseUrl = brandUrl.replace(/\/$/, "");
  let pages: SitePage[] = [];

  // Try sitemap.xml first
  pages = await parseSitemap(baseUrl);
  if (pages.length > 0) {
    console.log(`[InternalLinker] Found ${pages.length} pages from sitemap`);
    return pages;
  }

  // Fallback: crawl homepage for links
  pages = await crawlHomepage(baseUrl);
  console.log(`[InternalLinker] Found ${pages.length} pages from homepage crawl`);
  return pages;
}

async function parseSitemap(baseUrl: string): Promise<SitePage[]> {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap-0.xml`,
  ];

  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(8000),
        redirect: "follow",
      });

      if (!res.ok) continue;

      const xml = await res.text();
      if (!xml.includes("<url") && !xml.includes("<sitemap")) continue;

      // Handle sitemap index
      if (xml.includes("<sitemap>")) {
        const sitemapLocs = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
          .map(m => m[1].trim())
          .filter(url => url.endsWith(".xml"))
          .slice(0, 2);

        for (const loc of sitemapLocs) {
          const subPages = await parseSingleSitemap(loc);
          if (subPages.length > 0) return subPages;
        }
        continue;
      }

      return parseSitemapXml(xml, baseUrl);
    } catch {
      continue;
    }
  }

  return [];
}

async function parseSingleSitemap(url: string): Promise<SitePage[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseSitemapXml(xml, new URL(url).origin);
  } catch {
    return [];
  }
}

function parseSitemapXml(xml: string, baseUrl: string): SitePage[] {
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)]
    .map(m => m[1].trim())
    .filter(url => {
      const lower = url.toLowerCase();
      return (
        url.startsWith(baseUrl) &&
        !lower.includes("/tag/") &&
        !lower.includes("/category/") &&
        !lower.includes("/author/") &&
        !lower.includes("/page/") &&
        !lower.includes("/feed") &&
        !lower.endsWith(".xml") &&
        !lower.endsWith(".pdf") &&
        !lower.endsWith(".jpg") &&
        !lower.endsWith(".png")
      );
    })
    .slice(0, 50);

  return urls.map(url => ({
    url,
    title: extractTitleFromUrl(url),
    description: "",
  }));
}

function extractTitleFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() || "";
    return slug
      .replace(/[-_]/g, " ")
      .replace(/\.[^.]+$/, "")
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  } catch {
    return url;
  }
}

async function crawlHomepage(baseUrl: string): Promise<SitePage[]> {
  try {
    const res = await fetch(baseUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });

    if (!res.ok) return [];

    const html = await res.text();
    const links = new Map<string, SitePage>();

    // Extract all internal links
    const linkMatches = html.matchAll(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi);
    for (const match of linkMatches) {
      let href = match[1];
      const text = match[2].replace(/<[^>]+>/g, "").trim();

      if (!text || text.length < 3 || text.length > 100) continue;

      // Resolve relative URLs
      if (href.startsWith("/")) {
        href = baseUrl + href;
      }

      if (!href.startsWith(baseUrl)) continue;

      const lower = href.toLowerCase();
      if (
        lower.includes("#") ||
        lower.includes("?") ||
        lower.includes("/tag/") ||
        lower.includes("/category/") ||
        lower.includes("javascript:") ||
        lower.includes("mailto:") ||
        lower === baseUrl + "/" ||
        lower === baseUrl
      ) continue;

      if (!links.has(href)) {
        links.set(href, {
          url: href,
          title: text,
          description: "",
        });
      }
    }

    return Array.from(links.values()).slice(0, 30);
  } catch {
    return [];
  }
}
