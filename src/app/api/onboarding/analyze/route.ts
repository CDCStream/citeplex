import { NextRequest, NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/onboarding/analyze";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/+$/, "");

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
