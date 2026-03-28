import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  registerForExchange,
  findMatches,
  requestBacklink,
  respondToRequest,
  getMyMatches,
  getExchangeStats,
} from "@/lib/content/backlink-exchange";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainId = req.nextUrl.searchParams.get("domainId");
    if (!domainId) {
      return NextResponse.json({ error: "domainId required" }, { status: 400 });
    }

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const action = req.nextUrl.searchParams.get("action");

    if (action === "matches") {
      const matches = await findMatches(domainId);
      return NextResponse.json({ matches });
    }

    if (action === "my-requests") {
      const requests = await getMyMatches(domainId);
      return NextResponse.json(requests);
    }

    const stats = await getExchangeStats(domainId);
    return NextResponse.json(stats);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, domainId } = body;

    const { data: domain } = await supabaseAdmin
      .from("domains")
      .select("id")
      .eq("id", domainId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    if (action === "register") {
      const { drScore, acceptsGuestPosts, preferredNiches } = body;
      const listing = await registerForExchange(
        domainId,
        drScore ?? 0,
        acceptsGuestPosts ?? true,
        preferredNiches ?? []
      );
      return NextResponse.json({ listing });
    }

    if (action === "request") {
      const { requesterListingId, targetListingId } = body;
      const match = await requestBacklink(requesterListingId, targetListingId);
      if (!match) {
        return NextResponse.json(
          { error: "Request already exists or failed" },
          { status: 400 }
        );
      }
      return NextResponse.json({ match });
    }

    if (action === "respond") {
      const { matchId, accept } = body;
      const success = await respondToRequest(matchId, accept);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
