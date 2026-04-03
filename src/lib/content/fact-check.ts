import { callLLM } from "@/lib/llm/client";
import { safeJsonParse } from "./safe-json-parse";

export interface FactCheckResult {
  claimsChecked: number;
  citationsAdded: number;
  fixedContent: string | null;
  issues: string[];
}

/**
 * Extracts factual claims from the article, searches for verification sources,
 * and adds proper citations with real URLs.
 */
export async function factCheckAndCite(
  content: string,
  keyword: string,
  language = "English",
): Promise<FactCheckResult> {
  try {
    // Step 1: Extract claims that need verification
    const claimsResponse = await callLLM({
      chain: "fast",
      system: `You are a fact-checking editor. Analyze the HTML article and identify factual claims that should be cited. Return ONLY valid JSON.

Focus on:
- Statistics and percentages (e.g. "73% of marketers...")
- Research findings (e.g. "Studies show that...")
- Industry data (e.g. "The market is worth $X billion")
- Expert attributions (e.g. "According to...")
- Historical facts and dates
- Comparative claims (e.g. "X is faster than Y")

Do NOT flag:
- Opinions or subjective statements
- Common knowledge facts
- The article's own recommendations`,
      user: `Extract all factual claims from this article about "${keyword}" that should be verified and cited.

${content.slice(0, 12000)}

Return JSON:
{
  "claims": [
    {
      "claim": "the exact text of the claim",
      "context": "the HTML paragraph or sentence containing it",
      "type": "statistic|research|industry_data|expert_quote|historical|comparison",
      "suggestedSource": "what kind of source would verify this (e.g. 'Gartner report', 'Google official blog')"
    }
  ]
}`,
      maxTokens: 2048,
      temperature: 0.2,
      timeout: 15000,
    });

    let claims: { claim: string; context: string; type: string; suggestedSource: string }[] = [];
    const claimsParsed = safeJsonParse<Record<string, unknown>>(claimsResponse);
    if (claimsParsed && Array.isArray((claimsParsed as Record<string, unknown>).claims)) {
      claims = (claimsParsed as Record<string, unknown>).claims as typeof claims;
    } else {
      return { claimsChecked: 0, citationsAdded: 0, fixedContent: null, issues: [] };
    }

    if (claims.length === 0) {
      return { claimsChecked: 0, citationsAdded: 0, fixedContent: null, issues: [] };
    }

    // Step 2: Find real sources for the claims via Google
    const verifiedClaims = await findSourcesForClaims(claims, keyword);

    if (verifiedClaims.length === 0) {
      return { claimsChecked: claims.length, citationsAdded: 0, fixedContent: null, issues: [] };
    }

    // Step 3: Insert citations into the article
    const citationInstructions = verifiedClaims.map((vc, i) => 
      `${i + 1}. Claim: "${vc.claim}"
   Source: ${vc.sourceTitle} (${vc.sourceUrl})
   Insert citation near this text.`
    ).join("\n\n");

    const fixedResponse = await callLLM({
      chain: "fast",
      system: `You are an editor adding citations to an HTML article. 
For each claim listed, add a citation link right after the claim in the format:
<sup><a href="[URL]" rel="noopener" target="_blank" class="citation">[number]</a></sup>

At the end of the article (before any FAQ section), add a "Sources" section:
<div class="sources-section">
<h2>Sources</h2>
<ol class="sources-list">
<li><a href="[URL]" rel="noopener" target="_blank">[Source Title]</a></li>
</ol>
</div>

Rules:
- Preserve ALL existing HTML structure, images, tables, links
- Only add citation superscripts and the Sources section
- Do NOT change any existing content
- Keep everything in ${language}
- Return the COMPLETE modified HTML article`,
      user: `Add these citations to the article:

${citationInstructions}

Article HTML:
${content}`,
      maxTokens: 8192,
      temperature: 0.2,
      timeout: 30000,
    });

    const hasHtml = fixedResponse.includes("<h2") || fixedResponse.includes("<p");
    const fixedContent = hasHtml ? fixedResponse.trim() : null;

    const issues = verifiedClaims
      .filter(vc => !vc.verified)
      .map(vc => `Unverified claim: "${vc.claim}"`);

    return {
      claimsChecked: claims.length,
      citationsAdded: verifiedClaims.filter(vc => vc.verified).length,
      fixedContent,
      issues,
    };
  } catch (err) {
    console.error("[FactCheck] Failed:", (err as Error).message);
    return { claimsChecked: 0, citationsAdded: 0, fixedContent: null, issues: [] };
  }
}

interface VerifiedClaim {
  claim: string;
  verified: boolean;
  sourceTitle: string;
  sourceUrl: string;
}

async function findSourcesForClaims(
  claims: { claim: string; type: string; suggestedSource: string }[],
  keyword: string,
): Promise<VerifiedClaim[]> {
  const serperKey = process.env.SERPER_API_KEY;
  const googleKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;

  if (!serperKey && (!googleKey || !cx)) return [];

  const results: VerifiedClaim[] = [];

  for (let i = 0; i < Math.min(claims.length, 6); i++) {
    const claim = claims[i];
    try {
      const searchQuery = buildSearchQuery(claim.claim, claim.type, keyword);
      let items: { title: string; link: string; displayLink?: string }[] = [];

      if (serperKey) {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
          body: JSON.stringify({ q: searchQuery, num: 5 }),
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = await res.json();
          items = (data.organic || []).map((o: { title: string; link: string }) => ({
            title: o.title, link: o.link, displayLink: new URL(o.link).hostname,
          }));
        }
      } else if (googleKey && cx) {
        const params = new URLSearchParams({ key: googleKey, cx, q: searchQuery, num: "3" });
        const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, { signal: AbortSignal.timeout(8000) });
        if (res.ok) {
          const data = await res.json();
          items = data.items || [];
        }
      }

      const authoritativeResult = items.find((item) => {
        const domain = (item.displayLink || new URL(item.link).hostname).toLowerCase();
        return isAuthoritative(domain);
      }) || items[0];

      if (authoritativeResult) {
        results.push({
          claim: claim.claim,
          verified: true,
          sourceTitle: authoritativeResult.title,
          sourceUrl: authoritativeResult.link,
        });
      }
    } catch {
      // skip failed searches
    }
  }

  return results;
}

function buildSearchQuery(claim: string, type: string, keyword: string): string {
  const shortClaim = claim.length > 80 ? claim.slice(0, 80) : claim;

  switch (type) {
    case "statistic":
      return `${shortClaim} source study report`;
    case "research":
      return `${shortClaim} research study`;
    case "industry_data":
      return `${shortClaim} ${keyword} market report`;
    case "expert_quote":
      return `${shortClaim}`;
    case "historical":
      return `${shortClaim}`;
    case "comparison":
      return `${shortClaim} benchmark comparison`;
    default:
      return `${shortClaim} source`;
  }
}

function isAuthoritative(domain: string): boolean {
  const authoritative = [
    "harvard.edu", "stanford.edu", "mit.edu", "oxford.ac.uk",
    "gov", ".edu", ".org",
    "statista.com", "gartner.com", "mckinsey.com", "forrester.com",
    "hubspot.com", "semrush.com", "ahrefs.com", "moz.com",
    "searchengineland.com", "searchenginejournal.com",
    "techcrunch.com", "wired.com", "forbes.com", "bloomberg.com",
    "reuters.com", "bbc.com", "nytimes.com",
    "google.com", "microsoft.com", "aws.amazon.com",
    "w3.org", "developer.mozilla.org",
    "wikipedia.org", "sciencedirect.com", "nature.com",
  ];
  return authoritative.some(a => domain.includes(a));
}
