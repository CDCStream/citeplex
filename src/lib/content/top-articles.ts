const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export interface TopArticle {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  content: string;
  headings: string[];
  wordCount: number;
}

/**
 * Searches Google for the top ranking articles for a keyword
 * and scrapes their content for use as reference material.
 */
export async function findAndScrapeTopArticles(
  keyword: string,
  count = 5,
): Promise<TopArticle[]> {
  const searchResults = await searchWeb(keyword, count + 3);
  if (searchResults.length === 0) {
    console.warn(`[TopArticles] No Google search results for "${keyword}"`);
    return [];
  }

  console.log(`[TopArticles] Google returned ${searchResults.length} results for "${keyword}"`);

  const scraped = await Promise.allSettled(
    searchResults.map(async (result) => {
      const parsed = await scrapeArticle(result.url);

      if (parsed && parsed.content.length >= 200) {
        return {
          title: result.title,
          url: result.url,
          snippet: result.snippet,
          domain: result.domain,
          content: parsed.content,
          headings: parsed.headings,
          wordCount: parsed.wordCount,
        };
      }

      // Fallback: use Google snippet as content when scraping fails
      console.log(`[TopArticles] Scraping failed for ${result.domain}, using snippet fallback`);
      return {
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        domain: result.domain,
        content: result.snippet || result.title,
        headings: [],
        wordCount: (result.snippet || "").split(/\s+/).length,
      };
    })
  );

  const articles = scraped
    .filter((r): r is PromiseFulfilledResult<TopArticle> => r.status === "fulfilled")
    .map((r) => r.value)
    .slice(0, count);

  // Sort: fully scraped articles first, snippet-only fallbacks last
  articles.sort((a, b) => b.content.length - a.content.length);

  console.log(`[TopArticles] Returning ${articles.length} articles (${articles.filter(a => a.headings.length > 0).length} fully scraped)`);
  return articles;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

async function searchWeb(query: string, count: number): Promise<SearchResult[]> {
  // Try Serper.dev first (primary), then Google Custom Search (fallback)
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    const results = await searchSerper(query, count, serperKey);
    if (results.length > 0) return results;
  }

  const googleKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (googleKey && cx) {
    const results = await searchGoogle(query, count, googleKey, cx);
    if (results.length > 0) return results;
  }

  console.warn("[TopArticles] No search API configured (set SERPER_API_KEY or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_CX)");
  return [];
}

async function searchSerper(query: string, count: number, apiKey: string): Promise<SearchResult[]> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: Math.min(count + 2, 10) }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`[TopArticles] Serper API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const organic: { title: string; link: string; snippet?: string }[] = data.organic || [];

    console.log(`[TopArticles] Serper returned ${organic.length} results for "${query}"`);

    return organic
      .filter((item) => {
        const url = item.link.toLowerCase();
        return !url.includes("youtube.com") && !url.includes("reddit.com") && !url.includes("twitter.com") && !url.includes("facebook.com");
      })
      .slice(0, count)
      .map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
        domain: new URL(item.link).hostname.replace("www.", ""),
      }));
  } catch (err) {
    console.error("[TopArticles] Serper search failed:", (err as Error).message);
    return [];
  }
}

async function searchGoogle(query: string, count: number, apiKey: string, cx: string): Promise<SearchResult[]> {
  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q: query,
      num: String(Math.min(count + 2, 10)),
    });

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      console.error(`[TopArticles] Google Search API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const items: { title: string; link: string; snippet?: string; displayLink?: string }[] = data.items || [];

    return items
      .filter((item) => {
        const url = item.link.toLowerCase();
        return !url.includes("youtube.com") && !url.includes("reddit.com") && !url.includes("twitter.com") && !url.includes("facebook.com");
      })
      .slice(0, count)
      .map((item) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet || "",
        domain: item.displayLink || new URL(item.link).hostname,
      }));
  } catch (err) {
    console.error("[TopArticles] Google search failed:", (err as Error).message);
    return [];
  }
}

interface ParsedArticle {
  content: string;
  headings: string[];
  wordCount: number;
}

async function scrapeArticle(url: string): Promise<ParsedArticle | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.log(`[TopArticles] Scrape HTTP ${res.status} for ${url}`);
      return null;
    }

    const html = await res.text();
    if (!html || html.length < 500) return null;

    const content = extractArticleText(html);
    const headings = extractHeadings(html);
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return { content: content.slice(0, 10000), headings, wordCount };
  } catch (err) {
    console.log(`[TopArticles] Scrape error for ${url}: ${(err as Error).message}`);
    return null;
  }
}

function extractArticleText(html: string): string {
  let text = html;

  // Remove scripts, styles, nav, footer, sidebar, header, ads
  text = text.replace(/<script[\s\S]*?<\/script>/gi, " ");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, " ");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  text = text.replace(/<header[\s\S]*?<\/header>/gi, " ");
  text = text.replace(/<aside[\s\S]*?<\/aside>/gi, " ");
  text = text.replace(/<form[\s\S]*?<\/form>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Try to find article/main content
  const articleMatch = text.match(/<article[\s\S]*?<\/article>/i);
  const mainMatch = text.match(/<main[\s\S]*?<\/main>/i);
  const contentDiv = text.match(/<div[^>]*class="[^"]*(?:content|post|article|entry|blog)[^"]*"[\s\S]*?<\/div>/i);

  const focusedHtml = articleMatch?.[0] || mainMatch?.[0] || contentDiv?.[0] || text;

  // Strip remaining HTML tags
  let cleaned = focusedHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const matches = html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
  for (const m of matches) {
    const text = m[1].replace(/<[^>]+>/g, "").trim();
    if (text.length > 3 && text.length < 200) {
      headings.push(text);
    }
  }
  return headings.slice(0, 30);
}
