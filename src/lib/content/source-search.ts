export interface SourceRef {
  title: string;
  url: string;
  domain: string;
}

const AUTHORITATIVE_DOMAINS = [
  ".edu", ".gov", ".org",
  "statista.com", "gartner.com", "mckinsey.com", "forrester.com",
  "hubspot.com", "semrush.com", "ahrefs.com", "moz.com",
  "searchengineland.com", "searchenginejournal.com",
  "techcrunch.com", "forbes.com", "bloomberg.com",
  "reuters.com", "google.com", "microsoft.com",
  "wikipedia.org", "nature.com",
];

export async function searchRelevantSources(keyword: string): Promise<SourceRef[]> {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) return [];

  try {
    const queries = [
      `${keyword} statistics report ${new Date().getFullYear()}`,
      `${keyword} research study`,
    ];

    const results: SourceRef[] = [];
    const seen = new Set<string>();

    for (const q of queries) {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 5 }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      for (const item of data.organic || []) {
        const host = new URL(item.link).hostname.toLowerCase();
        if (seen.has(host)) continue;
        seen.add(host);
        results.push({ title: item.title, url: item.link, domain: host });
      }
    }

    results.sort((a, b) => {
      const aAuth = AUTHORITATIVE_DOMAINS.some(d => a.domain.includes(d)) ? 0 : 1;
      const bAuth = AUTHORITATIVE_DOMAINS.some(d => b.domain.includes(d)) ? 0 : 1;
      return aAuth - bAuth;
    });

    return results.slice(0, 8);
  } catch {
    return [];
  }
}
