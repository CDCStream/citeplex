import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  researchTopic,
  generateOutline,
  writeArticle,
  DEFAULT_ENHANCEMENTS,
} from "@/lib/content/article-generator";
import { generateArticleImages } from "@/lib/content/image-generator";
import { searchYouTubeVideos, buildVideoEmbedHtml } from "@/lib/content/youtube-search";
import { searchWebImages, searchInfographics, buildWebImageHtml } from "@/lib/content/web-image-search";

export const maxDuration = 300;

function checkSecret(req: NextRequest) {
  const adminSecret = process.env.BLOG_ADMIN_SECRET?.trim();
  if (!adminSecret) return false;
  return req.headers.get("x-admin-secret") === adminSecret;
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { brandName, brandUrl, industry, keyword, title } = await req.json();

    if (!brandName || !brandUrl || !industry || !keyword || !title) {
      return NextResponse.json(
        { error: "Missing required fields: brandName, brandUrl, industry, keyword, title" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    const { data: existing } = await supabaseAdmin
      .from("writing_examples")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("writing_examples").delete().eq("id", existing.id);
      console.log(`[GenerateExample] Deleted existing example: ${slug}`);
    }

    console.log(`[GenerateExample] Starting: "${title}" for ${brandName}`);

    const research = await researchTopic(title, keyword, brandName, industry);
    console.log(`[GenerateExample] Research complete`);

    const outline = await generateOutline(title, keyword, research, 1500);
    console.log(`[GenerateExample] Outline generated: ${outline.length} sections`);

    const enhancements = {
      ...DEFAULT_ENHANCEMENTS,
      callToAction: `Discover how ${brandName} can help you achieve better results. Visit ${brandUrl} to learn more.`,
    };

    const article = await writeArticle(
      title,
      keyword,
      outline,
      research,
      brandName,
      brandUrl,
      1500,
      "English",
      "",
      "",
      enhancements,
      [],
      [],
    );
    console.log(`[GenerateExample] Article written: ${article.wordCount} words`);

    let enrichedContent = article.content;
    let coverImageUrl: string | null = null;

    try {
      const [videos, images, webImgs, infographics] = await Promise.allSettled([
        searchYouTubeVideos(keyword, 2),
        generateArticleImages(title, keyword, 3),
        searchWebImages(keyword, 2),
        searchInfographics(keyword, 2),
      ]);

      const videoResults = videos.status === "fulfilled" ? videos.value : [];
      if (videoResults.length > 0) {
        enrichedContent += buildVideoEmbedHtml(videoResults);
        console.log(`[GenerateExample] YouTube videos: ${videoResults.length}`);
      }

      const imageResults = images.status === "fulfilled" ? images.value : [];
      coverImageUrl = imageResults[0]?.url || null;
      if (imageResults.length > 1) {
        const inlineImages = imageResults.slice(1);
        const paragraphs = enrichedContent.split("</p>");
        const step = Math.max(1, Math.floor(paragraphs.length / (inlineImages.length + 1)));
        for (let i = 0; i < inlineImages.length; i++) {
          const insertAt = step * (i + 1);
          if (insertAt < paragraphs.length) {
            paragraphs[insertAt] = `</p><figure class="my-8"><img src="${inlineImages[i].url}" alt="${inlineImages[i].alt}" class="rounded-lg w-full" loading="lazy" /></figure>${paragraphs[insertAt]}`;
          }
        }
        enrichedContent = paragraphs.join("</p>");
        console.log(`[GenerateExample] Inline AI images: ${inlineImages.length}`);
      }

      const webImageResults = webImgs.status === "fulfilled" ? webImgs.value : [];
      const infographicResults = infographics.status === "fulfilled" ? infographics.value : [];
      const allWebImages = [...webImageResults, ...infographicResults];
      if (allWebImages.length > 0) {
        const sections = enrichedContent.split("</h2>");
        const insertEvery = Math.max(1, Math.floor(sections.length / (allWebImages.length + 1)));
        for (let i = 0; i < allWebImages.length; i++) {
          const insertAt = insertEvery * (i + 1);
          if (insertAt < sections.length) {
            sections[insertAt] = `</h2>${buildWebImageHtml(allWebImages[i])}${sections[insertAt]}`;
          }
        }
        enrichedContent = sections.join("</h2>");
        console.log(`[GenerateExample] Web images/infographics: ${allWebImages.length}`);
      }

      if (coverImageUrl) {
        enrichedContent = `<figure class="article-cover"><img src="${coverImageUrl}" alt="${title}" />\n</figure>\n${enrichedContent}`;
      }

      console.log(`[GenerateExample] Media enrichment complete`);
    } catch (err) {
      console.error("[GenerateExample] Media enrichment failed:", (err as Error).message);
    }

    const { data, error } = await supabaseAdmin.from("writing_examples").insert({
      slug,
      brand_name: brandName,
      brand_url: brandUrl,
      brand_industry: industry,
      title,
      keyword,
      meta_description: article.metaDescription,
      content: enrichedContent,
      cover_image_url: coverImageUrl,
      word_count: article.wordCount,
    }).select("id, slug").single();

    if (error) {
      console.error("[GenerateExample] Insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[GenerateExample] Done: ${slug} (id: ${data.id})`);

    return NextResponse.json({
      success: true,
      id: data.id,
      slug: data.slug,
      wordCount: article.wordCount,
      coverImage: coverImageUrl,
    });
  } catch (err) {
    console.error("[GenerateExample] Error:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count: examplesCount } = await supabaseAdmin
    .from("writing_examples")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    deleted: { writing_examples: examplesCount ?? 0 },
  });
}
