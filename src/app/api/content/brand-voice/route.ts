import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  analyzeBrandVoice,
  scrapePageText,
  type BrandVoiceProfile,
} from "@/lib/content/brand-voice";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { domainId, sampleUrls } = body as {
      domainId: string;
      sampleUrls: string[];
    };

    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    if (!sampleUrls?.length || sampleUrls.length < 1) {
      return NextResponse.json(
        { error: "Provide at least 1 sample URL" },
        { status: 400 }
      );
    }

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      );
    }

    const texts = await Promise.all(sampleUrls.slice(0, 5).map(scrapePageText));
    const validTexts = texts.filter((t) => t.length > 100);

    if (validTexts.length === 0) {
      return NextResponse.json(
        { error: "Could not extract enough text from the provided URLs" },
        { status: 400 }
      );
    }

    const profile = await analyzeBrandVoice(validTexts);

    await supabaseAdmin
      .from("domains")
      .update({ brand_voice: profile })
      .eq("id", domainId);

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Brand voice analysis error:", err);
    return NextResponse.json(
      { error: "Brand voice analysis failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainId = req.nextUrl.searchParams.get("domainId");
    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("brand_voice")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile: (domain.brand_voice as BrandVoiceProfile) ?? null,
    });
  } catch (err) {
    console.error("Brand voice fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch brand voice" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainId = req.nextUrl.searchParams.get("domainId");
    if (!domainId) {
      return NextResponse.json(
        { error: "domainId is required" },
        { status: 400 }
      );
    }

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json(
        { error: "Domain not found" },
        { status: 404 }
      );
    }

    await supabaseAdmin
      .from("domains")
      .update({ brand_voice: null })
      .eq("id", domainId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Brand voice delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete brand voice" },
      { status: 500 }
    );
  }
}
