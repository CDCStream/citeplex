/**
 * Transforms a user keyword/query into a natural-sounding AI prompt
 * that elicits brand recommendations in a ranked list format.
 */
export function buildScanPrompt(keyword: string, industry?: string | null): string {
  const trimmed = keyword.trim();

  const isQuestion =
    trimmed.endsWith("?") ||
    /^(what|which|how|who|where|why|can|do|does|is|are|should|would|could|recommend|suggest|compare|best|top|ne|hangi|nasıl|nerede|en iyi)/i.test(trimmed);

  if (isQuestion) {
    return `${trimmed}\n\nPlease list the top options as a numbered list (1, 2, 3...) with their names and websites.`;
  }

  const industryHint = industry ? ` in the ${industry} space` : "";
  return `What are the best ${trimmed}${industryHint}? Please provide a numbered list of the top tools, products, or companies, including their names and websites.`;
}

/**
 * Builds a competitor-aware scan prompt.
 */
export function buildCompetitorPrompt(
  keyword: string,
  brandName: string,
  competitorName: string
): string {
  return `${keyword} — Compare ${brandName} and ${competitorName}. Which one would you recommend and why?`;
}
