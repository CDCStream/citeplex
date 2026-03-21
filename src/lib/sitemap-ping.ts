import { getSiteUrl } from "@/lib/site";

/** Pings Google & Bing sitemap endpoints (best-effort). */
export async function pingSearchEngines(): Promise<void> {
  const base = getSiteUrl();
  const sitemapUrl = `${base}/sitemap.xml`;
  const enc = encodeURIComponent(sitemapUrl);

  const urls = [
    `https://www.google.com/ping?sitemap=${enc}`,
    `https://www.bing.com/ping?sitemap=${enc}`,
  ];

  await Promise.allSettled(
    urls.map((url) =>
      fetch(url, { method: "GET", signal: AbortSignal.timeout(8000) }).catch(
        () => undefined,
      ),
    ),
  );
}
