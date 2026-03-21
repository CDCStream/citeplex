import { NextRequest, NextResponse } from "next/server";
import { analyzeWebsite } from "@/lib/onboarding/analyze";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const analysis = await analyzeWebsite(url);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Analysis failed" },
      { status: 500 }
    );
  }
}
