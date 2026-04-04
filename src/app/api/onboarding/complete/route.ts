import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { logActivity } from "@/lib/activity-logger";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, brandName, description, industry, competitors, primaryCountry, targetCountries, prompts, articlePreferences } = await req.json();

    if (!url || !brandName) {
      return NextResponse.json({ error: "URL and brand name are required" }, { status: 400 });
    }

    let parsed: URL;
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      parsed = new URL(normalized);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const BLOCKED_DOMAINS = [
      "google.com", "youtube.com", "facebook.com", "instagram.com",
      "twitter.com", "x.com", "tiktok.com", "reddit.com", "linkedin.com",
      "wikipedia.org", "amazon.com", "apple.com", "microsoft.com",
      "github.com", "stackoverflow.com", "pinterest.com", "whatsapp.com",
      "telegram.org", "discord.com", "twitch.tv", "netflix.com",
      "spotify.com", "docs.google.com", "drive.google.com",
    ];
    const hostname = parsed.hostname.replace(/^www\./, "");
    if (BLOCKED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
      return NextResponse.json(
        { error: "Platform domains cannot be added. Please use your own website URL." },
        { status: 400 },
      );
    }

    const { data: domain, error: domainError } = await supabaseAdmin
      .from("domains")
      .insert({
        user_id: user.id,
        url,
        brand_name: brandName,
        description: description || null,
        industry: industry || null,
        primary_country: primaryCountry || null,
        target_countries: targetCountries ? JSON.stringify(targetCountries) : null,
        verified: true,
        article_preferences: articlePreferences || { includeCta: true, includeFaq: true },
      })
      .select()
      .single();

    if (domainError || !domain) {
      throw domainError || new Error("Failed to create domain");
    }

    if (competitors?.length > 0) {
      const competitorRows = competitors.map((c: { brandName: string; url: string }) => ({
        domain_id: domain.id,
        brand_name: c.brandName,
        url: c.url,
      }));

      await supabaseAdmin.from("competitors").insert(competitorRows);
    }

    if (prompts?.length > 0) {
      const promptRows = prompts.map((p: { text: string; category?: string; language?: string; country?: string }) => ({
        domain_id: domain.id,
        text: p.text,
        category: p.category || null,
        language: p.language || null,
        country: p.country || null,
        is_active: true,
      }));

      await supabaseAdmin.from("prompts").insert(promptRows);
    }

    logActivity({ userId: user.id, action: "onboarding.complete", resourceType: "domain", resourceId: domain.id, metadata: { brand_name: brandName, url, competitors: competitors?.length ?? 0, prompts: prompts?.length ?? 0 } });

    return NextResponse.json({ domainId: domain.id });
  } catch (err) {
    console.error("Onboarding complete error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to save" },
      { status: 500 }
    );
  }
}
