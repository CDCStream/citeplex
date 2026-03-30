import { supabaseAdmin } from "@/lib/supabase/server";

export interface GeneratedImage {
  url: string;
  alt: string;
  revisedPrompt?: string;
}

const BUCKET = "article-images";

async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (!data) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: true });
  }
}

async function uploadToStorage(tempUrl: string, filename: string): Promise<string | null> {
  try {
    const res = await fetch(tempUrl, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/png";

    await ensureBucket();

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType, upsert: true });

    if (error) {
      console.error("[ImageGen] Storage upload error:", error.message);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filename);
    return urlData.publicUrl;
  } catch (err) {
    console.error("[ImageGen] Upload failed:", (err as Error).message);
    return null;
  }
}

export async function generateArticleImages(
  title: string,
  keyword: string,
  count = 3
): Promise<GeneratedImage[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const prompts = buildImagePrompts(title, keyword, count);
  const results: GeneratedImage[] = [];
  const timestamp = Date.now();

  for (let i = 0; i < prompts.length; i++) {
    const p = prompts[i];
    const isCover = i === 0;
    let image = await generateSingleImage(apiKey, p.prompt, p.alt);

    if (!image && isCover) {
      console.log("[ImageGen] Cover image failed, retrying with simpler prompt...");
      image = await generateSingleImage(
        apiKey,
        `A clean, professional blog header image with abstract geometric shapes and gradients. Modern digital art style, no text, suitable for a tech blog article. Blue and purple tones.`,
        p.alt,
      );
    }

    if (image) {
      const slug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
      const filename = `${slug}-${timestamp}-${i}.png`;
      const permanentUrl = await uploadToStorage(image.url, filename);
      if (permanentUrl) {
        image.url = permanentUrl;
      }
      results.push(image);
    }
  }

  return results;
}

function buildImagePrompts(
  title: string,
  keyword: string,
  count: number
): { prompt: string; alt: string }[] {
  const prompts: { prompt: string; alt: string }[] = [];

  prompts.push({
    prompt: `Create a professional, modern blog cover image for an article titled "${title}". The image should be visually striking, use a clean design style with subtle gradients, and represent the topic "${keyword}". No text in the image. Photorealistic style.`,
    alt: `Cover image for ${title}`,
  });

  if (count >= 2) {
    prompts.push({
      prompt: `Create an informative illustration or diagram related to "${keyword}". Modern, clean design with a professional color palette. Suitable as an inline image in a blog article. No text overlay.`,
      alt: `Illustration about ${keyword}`,
    });
  }

  if (count >= 3) {
    prompts.push({
      prompt: `Create a conceptual image representing key aspects of "${keyword}" for a blog article about "${title}". Use a modern, minimalist style with professional colors. No text. Suitable as supporting visual content.`,
      alt: `${keyword} concept visualization`,
    });
  }

  return prompts.slice(0, count);
}

async function generateSingleImage(
  apiKey: string,
  prompt: string,
  alt: string
): Promise<GeneratedImage | null> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      response_format: "url",
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[ImageGen] DALL-E error ${res.status}: ${err}`);
    return null;
  }

  const data = await res.json();
  const imageData = data.data?.[0];
  if (!imageData?.url) return null;

  return {
    url: imageData.url,
    alt,
    revisedPrompt: imageData.revised_prompt,
  };
}
