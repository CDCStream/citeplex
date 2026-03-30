import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: addons } = await supabaseAdmin
    .from("prompt_addon_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return NextResponse.json({ addons: addons ?? [] });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { addonId } = await req.json();
  if (!addonId) {
    return NextResponse.json({ error: "addonId is required" }, { status: 400 });
  }

  const { data: addon } = await supabaseAdmin
    .from("prompt_addon_subscriptions")
    .select("*")
    .eq("id", addonId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!addon) {
    return NextResponse.json({ error: "Addon not found" }, { status: 404 });
  }

  await supabaseAdmin
    .from("prompt_addon_subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", addonId);

  return NextResponse.json({ ok: true });
}
