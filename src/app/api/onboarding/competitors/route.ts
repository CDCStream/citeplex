import { NextRequest, NextResponse } from "next/server";
import { findCompetitors } from "@/lib/onboarding/analyze";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { brandName, description, industry } = await req.json();
    if (!brandName) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const competitors = await findCompetitors(brandName, description || "", industry || "");
    return NextResponse.json({ competitors });
  } catch (err) {
    console.error("Competitor finding error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Competitor finding failed" },
      { status: 500 }
    );
  }
}
