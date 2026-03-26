const URL_REGEX = /https?:\/\/[^\s"'<>\])},]+/gi;

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, "").toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/+$/, "");
  }
}

export function extractSources(
  responseText: string,
  apiCitations: string[]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  function add(url: string) {
    const normalized = normalizeUrl(url);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(url);
    }
  }

  for (const url of apiCitations) {
    if (url.startsWith("http")) add(url);
  }

  const textUrls = responseText.match(URL_REGEX) ?? [];
  for (const url of textUrls) {
    const cleaned = url.replace(/[.,;:!?)}\]]+$/, "");
    add(cleaned);
  }

  return result;
}
