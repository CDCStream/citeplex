export interface WebImage {
  url: string;
  alt: string;
  sourceUrl: string;
  sourceDomain: string;
  width: number;
  height: number;
}

async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Citeplex/1.0)" },
    });
    if (!res.ok) return false;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    return ct.startsWith("image/");
  } catch {
    return false;
  }
}

async function filterValidImages(images: WebImage[], count: number): Promise<WebImage[]> {
  const checks = await Promise.all(images.map(async (img) => ({ img, valid: await validateImageUrl(img.url) })));
  return checks.filter(c => c.valid).map(c => c.img).slice(0, count);
}

export async function searchWebImages(
  query: string,
  count = 3
): Promise<WebImage[]> {
  const extra = 4;

  // Try Serper image search first
  const serperKey = process.env.SERPER_API_KEY;
  if (serperKey) {
    const results = await searchSerperImages(query, count + extra, serperKey);
    if (results.length > 0) return filterValidImages(results, count);
  }

  // Fallback to Google Custom Search
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey, cx, q: query,
      searchType: "image", num: String(Math.min(count + extra, 10)),
      imgSize: "large", imgType: "photo", safe: "active",
      rights: "cc_publicdomain|cc_attribute|cc_sharealike",
    });

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    const images = (data.items || []).slice(0, count + extra).map(
      (item: { link: string; title: string; displayLink: string; image: { contextLink: string; width: number; height: number } }) => ({
        url: item.link, alt: item.title || query,
        sourceUrl: item.image?.contextLink || "", sourceDomain: item.displayLink || "",
        width: item.image?.width || 0, height: item.image?.height || 0,
      })
    );
    return filterValidImages(images, count);
  } catch {
    return [];
  }
}

export async function searchInfographics(
  query: string,
  count = 2
): Promise<WebImage[]> {
  return searchWebImages(`${query} infographic OR diagram OR comparison chart`, count);
}

async function searchSerperImages(query: string, count: number, apiKey: string): Promise<WebImage[]> {
  try {
    const res = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: Math.min(count + 2, 10) }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const images: { title: string; imageUrl: string; link: string; source: string; imageWidth: number; imageHeight: number }[] = data.images || [];

    return images.slice(0, count).map((img) => ({
      url: img.imageUrl,
      alt: img.title || query,
      sourceUrl: img.link || "",
      sourceDomain: img.source || "",
      width: img.imageWidth || 0,
      height: img.imageHeight || 0,
    }));
  } catch {
    return [];
  }
}

export function buildWebImageHtml(image: WebImage): string {
  return `<figure class="my-8">
  <img src="${image.url}" alt="${image.alt}" class="rounded-lg w-full" loading="lazy" />
  <figcaption class="text-sm text-muted-foreground mt-2">
    Image Source: <a href="${image.sourceUrl}" rel="noopener" target="_blank">${image.sourceDomain}</a>
  </figcaption>
</figure>`;
}
