import { NextRequest, NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/onboarding/analyze";
import { getAuthUser } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let normalizedUrl = url.trim();

    if (normalizedUrl.length > 2048) {
      return NextResponse.json({ error: "URL is too long" }, { status: 400 });
    }

    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/+$/, "");

    let parsed: URL;
    try {
      parsed = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Only HTTP(S) URLs are allowed" }, { status: 400 });
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
        { error: "Please enter your own website URL, not a social media or platform URL" },
        { status: 400 },
      );
    }

    const analysis = await analyzeWebsite(normalizedUrl);

    console.log(`[Analyze] ${normalizedUrl} → brand="${analysis.brandName}", industry="${analysis.industry}", country="${analysis.primaryCountry}", desc="${analysis.description?.slice(0, 80)}..."`);

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Analysis failed" },
      { status: 500 }
    );
  }
}
