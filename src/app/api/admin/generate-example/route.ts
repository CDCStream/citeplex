import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  researchTopic,
  generateOutline,
  writeArticle,
  DEFAULT_ENHANCEMENTS,
} from "@/lib/content/article-generator";
import { generateArticleImages } from "@/lib/content/image-generator";

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
      return NextResponse.json(
        { error: `Example with slug "${slug}" already exists`, slug },
        { status: 409 }
      );
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

    let coverImageUrl: string | null = null;
    try {
      const images = await generateArticleImages(title, keyword, 1);
      coverImageUrl = images[0]?.url ?? null;
      console.log(`[GenerateExample] Cover image generated: ${coverImageUrl ? "yes" : "no"}`);
    } catch (err) {
      console.error("[GenerateExample] Image generation failed:", (err as Error).message);
    }

    const { data, error } = await supabaseAdmin.from("writing_examples").insert({
      slug,
      brand_name: brandName,
      brand_url: brandUrl,
      brand_industry: industry,
      title,
      keyword,
      meta_description: article.metaDescription,
      content: article.content,
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
