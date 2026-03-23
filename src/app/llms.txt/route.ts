import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";

/**
 * Machine-readable site summary for LLM / AI crawlers (llms.txt convention).
 * @see https://llmstxt.org/ (community pattern)
 */
export function GET() {
  const base = getSiteUrl();

  const body = `# Citeplex

> Citeplex is a B2B SaaS for **AI search visibility** (AEO / GEO): track how your brand appears across major AI assistants and answer engines, get recommendations, and run daily scans — at about half the cost of typical alternatives.

## Product
- **Name:** Citeplex
- **Site:** ${base}
- **Category:** AI visibility analytics, brand monitoring, generative engine optimization

## Primary pages
- Home: ${base}/
- Pricing: ${base}/pricing
- Blog: ${base}/blog
- Privacy: ${base}/privacy
- Terms: ${base}/terms

## Crawling & use
- **Public content** (marketing, blog, legal) may be summarized or cited with attribution.
- **Do not** scrape or train on authenticated areas: \`/dashboard\`, \`/api\`, \`/settings\`, \`/onboarding\`, \`/checkout\`, \`/auth\`.
- **Robots:** ${base}/robots.txt
- **Sitemap:** ${base}/sitemap.xml

## Contact
- General: hello@citeplex.io
- Privacy: privacy@citeplex.io
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
