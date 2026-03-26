export type Sentiment = "positive" | "negative" | "neutral";

export interface ParseResult {
  brandMentioned: boolean;
  urlMentioned: boolean;
  mentionCount: number;
  position: number | null;
  sentiment: Sentiment | null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Strips markdown formatting to get plain text for matching.
 * Removes bold, italic, links, headers, etc.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/#{1,6}\s+/g, "")               // ### Header → Header
    .replace(/\*\*([^*]+)\*\*/g, "$1")        // **bold** → bold
    .replace(/__([^_]+)__/g, "$1")            // __bold__ → bold
    .replace(/\*([^*]+)\*/g, "$1")            // *italic* → italic
    .replace(/_([^_]+)_/g, "$1")              // _italic_ → italic
    .replace(/`([^`]+)`/g, "$1");             // `code` → code
}

/**
 * Builds multiple patterns to match a brand name in various forms.
 * E.g. "Resume.io" → matches "Resume.io", "resume.io", "resumeio"
 */
function buildBrandPatterns(brandName: string): RegExp[] {
  const patterns: RegExp[] = [];
  const escaped = escapeRegex(brandName);

  // Exact match with word boundaries
  patterns.push(new RegExp(`\\b${escaped}\\b`, "gi"));

  // Match without dots/hyphens (e.g. "resumeio" for "Resume.io")
  const noPunctuation = brandName.replace(/[.\-_]/g, "");
  if (noPunctuation.toLowerCase() !== brandName.toLowerCase()) {
    patterns.push(new RegExp(`\\b${escapeRegex(noPunctuation)}\\b`, "gi"));
  }

  // Match with space instead of dots (e.g. "Resume io" for "Resume.io")
  const withSpaces = brandName.replace(/[.\-_]/g, " ").trim();
  if (withSpaces.toLowerCase() !== brandName.toLowerCase() && withSpaces.includes(" ")) {
    patterns.push(new RegExp(`\\b${escapeRegex(withSpaces)}\\b`, "gi"));
  }

  return patterns;
}

/**
 * Extracts list items from AI response, handling various formats:
 * - Numbered: "1. Item", "1) Item", "1: Item"
 * - Markdown headers: "### 1. Item"
 * - Bold numbered: "**1. Item**"
 * - Bulleted: "- Item", "* Item", "• Item"
 */
interface ListItem {
  index: number;
  content: string;
  rawLine: string;
}

function extractListItems(response: string): ListItem[] {
  const lines = response.split("\n");
  const items: ListItem[] = [];
  let bulletIndex = 0;

  for (const line of lines) {
    const stripped = stripMarkdown(line.trim());

    // Numbered list patterns (with optional markdown headers/bold)
    const numberedMatch = stripped.match(/^(\d+)[.):\s\-–—]+\s*(.*)/);
    if (numberedMatch && numberedMatch[2].trim().length > 0) {
      const num = parseInt(numberedMatch[1], 10);
      items.push({ index: num, content: numberedMatch[2], rawLine: line });
      bulletIndex = num;
      continue;
    }

    // Bulleted list: "- ", "* ", "• "
    const bulletMatch = stripped.match(/^[-*•]\s+(.*)/);
    if (bulletMatch && bulletMatch[1].trim().length > 0) {
      bulletIndex++;
      items.push({ index: bulletIndex, content: bulletMatch[1], rawLine: line });
      continue;
    }
  }

  return items;
}

/**
 * Detects brand position in a response.
 * First tries structured list detection, then falls back to paragraph order.
 */
function detectPosition(
  response: string,
  brandName: string,
  domainUrl: string
): number | null {
  const brandLower = brandName.toLowerCase();
  const normalizedUrl = domainUrl
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

  const brandPatterns = buildBrandPatterns(brandName);

  function matchesBrand(text: string): boolean {
    const lower = text.toLowerCase();
    // Check brand name patterns
    for (const pattern of brandPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) return true;
    }
    // Check URL
    if (normalizedUrl && lower.includes(normalizedUrl)) return true;
    return false;
  }

  // Try list-based detection first
  const listItems = extractListItems(response);
  if (listItems.length >= 2) {
    for (const item of listItems) {
      const plainContent = stripMarkdown(item.rawLine);
      if (matchesBrand(plainContent)) {
        return item.index;
      }
    }
  }

  // Fallback: paragraph-based position
  const paragraphs = response.split(/\n\n+/).filter((p) => p.trim().length > 20);
  if (paragraphs.length >= 2) {
    for (let i = 0; i < paragraphs.length; i++) {
      const plainParagraph = stripMarkdown(paragraphs[i]);
      if (matchesBrand(plainParagraph)) {
        return i + 1;
      }
    }
  }

  // Last fallback: if mentioned at all, return null (mentioned but no clear position)
  return null;
}

const POSITIVE_KEYWORDS = [
  "best", "top", "excellent", "leading", "recommended", "highly recommended",
  "popular", "reliable", "outstanding", "superior", "impressive", "innovative",
  "powerful", "comprehensive", "standout", "trusted", "preferred", "award-winning",
  "well-regarded", "strong", "great", "notable", "robust", "versatile", "efficient",
];

const NEGATIVE_KEYWORDS = [
  "worst", "avoid", "poor", "expensive", "limited", "lacks", "issues",
  "problems", "drawback", "weakness", "concern", "disadvantage", "overpriced",
  "outdated", "complicated", "frustrating", "inferior", "criticized", "downside",
  "not recommended", "lacking", "mediocre", "unreliable",
];

export function detectSentiment(
  response: string,
  brandName: string,
  domainUrl: string
): Sentiment {
  const lower = response.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const normalizedUrl = domainUrl
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

  const sentences = lower.split(/[.!?\n]+/).filter((s) => s.trim().length > 10);
  const brandSentences = sentences.filter(
    (s) => s.includes(brandLower) || (normalizedUrl && s.includes(normalizedUrl))
  );

  const contextText = brandSentences.length > 0 ? brandSentences.join(" ") : lower;

  let positiveCount = 0;
  let negativeCount = 0;

  for (const kw of POSITIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = contextText.match(regex);
    if (matches) positiveCount += matches.length;
  }

  for (const kw of NEGATIVE_KEYWORDS) {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = contextText.match(regex);
    if (matches) negativeCount += matches.length;
  }

  const score = positiveCount - negativeCount;
  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

export function parseResponse(
  response: string,
  brandName: string,
  domainUrl: string
): ParseResult {
  if (!response || !brandName) {
    return { brandMentioned: false, urlMentioned: false, mentionCount: 0, position: null, sentiment: null };
  }

  const plainText = stripMarkdown(response);

  // Brand name detection with multiple patterns
  const brandPatterns = buildBrandPatterns(brandName);
  let brandMatchCount = 0;
  for (const pattern of brandPatterns) {
    const matches = plainText.match(pattern);
    if (matches) brandMatchCount += matches.length;
  }
  const brandNameFound = brandMatchCount > 0;

  // URL detection
  const normalizedUrl = domainUrl
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

  const urlPattern = new RegExp(escapeRegex(normalizedUrl), "gi");
  const urlMatches = response.match(urlPattern) ?? [];
  const urlMentioned = urlMatches.length > 0;

  // Brand is mentioned if EITHER the name OR the URL appears
  const brandMentioned = brandNameFound || urlMentioned;
  const mentionCount = brandMatchCount + urlMatches.length;

  // Position detection (only if brand is mentioned)
  const position = brandMentioned ? detectPosition(response, brandName, domainUrl) : null;

  const sentiment = brandMentioned ? detectSentiment(response, brandName, domainUrl) : null;

  return { brandMentioned, urlMentioned, mentionCount, position, sentiment };
}
