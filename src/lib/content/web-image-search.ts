export interface WebImage {
  url: string;
  alt: string;
  sourceUrl: string;
  sourceDomain: string;
  width: number;
  height: number;
}

export async function searchWebImages(
  query: string,
  count = 3
): Promise<WebImage[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q: query,
      searchType: "image",
      num: String(Math.min(count, 10)),
      imgSize: "large",
      imgType: "photo",
      safe: "active",
      rights: "cc_publicdomain|cc_attribute|cc_sharealike",
    });

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const items = data.items || [];

    return items.slice(0, count).map(
      (item: {
        link: string;
        title: string;
        displayLink: string;
        image: { contextLink: string; width: number; height: number };
      }) => ({
        url: item.link,
        alt: item.title || query,
        sourceUrl: item.image?.contextLink || "",
        sourceDomain: item.displayLink || "",
        width: item.image?.width || 0,
        height: item.image?.height || 0,
      })
    );
  } catch (err) {
    console.error("[WebImageSearch] Failed:", err);
    return [];
  }
}

export async function searchInfographics(
  query: string,
  count = 2
): Promise<WebImage[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q: `${query} infographic OR diagram OR comparison chart`,
      searchType: "image",
      num: String(Math.min(count, 10)),
      imgSize: "xlarge",
      safe: "active",
    });

    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const items = data.items || [];

    return items.slice(0, count).map(
      (item: {
        link: string;
        title: string;
        displayLink: string;
        image: { contextLink: string; width: number; height: number };
      }) => ({
        url: item.link,
        alt: item.title || query,
        sourceUrl: item.image?.contextLink || "",
        sourceDomain: item.displayLink || "",
        width: item.image?.width || 0,
        height: item.image?.height || 0,
      })
    );
  } catch (err) {
    console.error("[InfographicSearch] Failed:", err);
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
