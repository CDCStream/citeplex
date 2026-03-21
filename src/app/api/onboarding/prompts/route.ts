import { NextRequest, NextResponse } from "next/server";
import { generatePrompts, type CountryInput } from "@/lib/onboarding/analyze";
import { getAuthUser } from "@/lib/auth";
import { getPromptLimit } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { brandName, description, industry, countries } = await req.json();
    if (!brandName) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 400 });
    }

    const user = await getAuthUser();
    let maxPrompts = 10;

    if (user) {
      const limit = getPromptLimit(user.plan || "free");
      const { count } = await supabaseAdmin
        .from("prompts")
        .select("id", { count: "exact", head: true })
        .in(
          "domain_id",
          (
            await supabaseAdmin
              .from("domains")
              .select("id")
              .eq("user_id", user.id)
          ).data?.map((d) => d.id) || []
        );
      const used = count || 0;
      maxPrompts = Math.max(1, limit - used);
    }

    const countryInputs: CountryInput[] | undefined = countries;
    const prompts = await generatePrompts(brandName, description || "", industry || "", countryInputs, maxPrompts);

    return NextResponse.json({ prompts, promptLimit: maxPrompts });
  } catch (err) {
    console.error("Prompt generation error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Prompt generation failed" },
      { status: 500 }
    );
  }
}
