import { NextResponse } from "next/server";
import { analyzePrompt } from "@/lib/ai-engines/detect-language";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const result = await analyzePrompt(text.trim());

  return NextResponse.json(result);
}
