import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site";

/**
 * Machine-readable site summary for LLM / AI crawlers (llms.txt convention).
 * @see https://llmstxt.org/ (community pattern)
 */
export function GET() {
  const base = getSiteUrl();

  const body = `# Citeplex

> Citeplex is an all-in-one **SEO, AEO & GEO platform**. Monitor your brand visibility across 7 AI engines (ChatGPT, Gemini, Claude, Perplexity and more), discover competitor content gaps, write AI-powered articles with built-in SEO optimization, and publish automatically to WordPress, Ghost, Notion, Webflow, Shopify and other platforms.

## Product
- **Name:** Citeplex
- **Site:** ${base}
- **Category:** SEO platform, AI visibility analytics (AEO/GEO), AI content writer, multi-platform publishing

## Key features
- **AI Visibility Tracking:** Monitor how AI engines mention your brand with sentiment analysis and actionable insights.
- **Competitor Gap Analysis:** Find prompts where competitors are mentioned but you are not, and close the gap.
- **Keyword Research:** Ahrefs-powered keyword volume and difficulty metrics for each prompt.
- **AI Article Writer:** Research-backed article generation with cover images, internal/external links, FAQ schema, and SEO scoring.
- **Content Planner:** Monthly calendar to plan and schedule articles.
- **Multi-platform Publishing:** One-click publish to WordPress, Ghost, Notion, Webflow, Shopify, Wix, Framer, Feather, and API webhooks.

## Primary pages
- Home: ${base}/
- Pricing: ${base}/pricing
- Blog: ${base}/blog
- Privacy: ${base}/privacy
- Terms: ${base}/terms

## Crawling & use
- **Public content** (marketing, blog, legal) may be summarized or cited with attribution.
- **Do not** scrape or train on authenticated areas: \`/dashboard\`, \`/api\`, \`/settings\`, \`/onboarding\`, \`/checkout\`, \`/auth\`, \`/admin\`.
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
