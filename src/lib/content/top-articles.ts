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
  const searchResults = await searchGoogle(keyword, count);
  if (searchResults.length === 0) return [];

  const scraped = await Promise.allSettled(
    searchResults.map(async (result) => {
      const parsed = await scrapeArticle(result.url);
      if (!parsed || parsed.content.length < 200) return null;
      return {
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        domain: result.domain,
        content: parsed.content,
        headings: parsed.headings,
        wordCount: parsed.wordCount,
      };
    })
  );

  return scraped
    .filter((r): r is PromiseFulfilledResult<TopArticle | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((a): a is TopArticle => a !== null)
    .slice(0, count);
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

async function searchGoogle(query: string, count: number): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) {
    console.warn("[TopArticles] GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_CX not set");
    return [];
  }

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
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const html = await res.text();
    if (!html || html.length < 500) return null;

    const content = extractArticleText(html);
    const headings = extractHeadings(html);
    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return { content: content.slice(0, 8000), headings, wordCount };
  } catch {
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
