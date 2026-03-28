export interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

export async function searchYouTubeVideos(
  query: string,
  maxResults = 2
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: String(maxResults),
      relevanceLanguage: "en",
      videoEmbeddable: "true",
      key: apiKey,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) {
      console.error(`[YouTube] API error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    return (data.items ?? []).map(
      (item: {
        id: { videoId: string };
        snippet: { title: string; thumbnails: { high: { url: string } }; channelTitle: string };
      }) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url ?? "",
        channelTitle: item.snippet.channelTitle,
      })
    );
  } catch (err) {
    console.error("[YouTube] Search failed:", err);
    return [];
  }
}

export function buildVideoEmbedHtml(videos: YouTubeVideo[]): string {
  if (videos.length === 0) return "";

  const embeds = videos
    .map(
      (v) =>
        `<div class="my-8"><div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:0.75rem"><iframe src="https://www.youtube.com/embed/${v.videoId}" title="${v.title}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe></div><p class="text-sm text-muted-foreground mt-2">${v.title} — ${v.channelTitle}</p></div>`
    )
    .join("\n");

  return `\n<h2>Related Videos</h2>\n${embeds}`;
}
