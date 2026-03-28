import { supabaseAdmin } from "@/lib/supabase/server";

export interface BacklinkListing {
  id: string;
  domain_id: string;
  url: string;
  brand_name: string;
  industry: string | null;
  dr_score: number;
  accepts_guest_posts: boolean;
  preferred_niches: string[];
  is_active: boolean;
  created_at: string;
}

export interface BacklinkMatch {
  id: string;
  requester_listing_id: string;
  target_listing_id: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  link_url: string | null;
  created_at: string;
}

export async function registerForExchange(
  domainId: string,
  drScore: number,
  acceptsGuestPosts: boolean,
  preferredNiches: string[]
): Promise<BacklinkListing | null> {
  const { data: domain } = await supabaseAdmin
    .from("domains")
    .select("id, url, brand_name, industry")
    .eq("id", domainId)
    .single();

  if (!domain) return null;

  const { data, error } = await supabaseAdmin
    .from("backlink_listings")
    .upsert(
      {
        domain_id: domainId,
        url: domain.url,
        brand_name: domain.brand_name,
        industry: domain.industry,
        dr_score: drScore,
        accepts_guest_posts: acceptsGuestPosts,
        preferred_niches: preferredNiches,
        is_active: true,
      },
      { onConflict: "domain_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[Backlinks] Registration failed:", error);
    return null;
  }

  return data;
}

export async function findMatches(
  domainId: string,
  limit = 10
): Promise<BacklinkListing[]> {
  const { data: myListing } = await supabaseAdmin
    .from("backlink_listings")
    .select("*")
    .eq("domain_id", domainId)
    .eq("is_active", true)
    .single();

  if (!myListing) return [];

  let query = supabaseAdmin
    .from("backlink_listings")
    .select("*")
    .eq("is_active", true)
    .neq("domain_id", domainId)
    .order("dr_score", { ascending: false })
    .limit(limit);

  if (myListing.industry) {
    query = query.or(`industry.eq.${myListing.industry},preferred_niches.cs.{${myListing.industry}}`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function requestBacklink(
  requesterListingId: string,
  targetListingId: string
): Promise<BacklinkMatch | null> {
  const { data: existing } = await supabaseAdmin
    .from("backlink_matches")
    .select("id")
    .eq("requester_listing_id", requesterListingId)
    .eq("target_listing_id", targetListingId)
    .maybeSingle();

  if (existing) return null;

  const { data, error } = await supabaseAdmin
    .from("backlink_matches")
    .insert({
      requester_listing_id: requesterListingId,
      target_listing_id: targetListingId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[Backlinks] Request failed:", error);
    return null;
  }

  return data;
}

export async function respondToRequest(
  matchId: string,
  accept: boolean
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("backlink_matches")
    .update({ status: accept ? "accepted" : "rejected" })
    .eq("id", matchId);

  return !error;
}

export async function completeBacklink(
  matchId: string,
  linkUrl: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("backlink_matches")
    .update({ status: "completed", link_url: linkUrl })
    .eq("id", matchId);

  return !error;
}

export async function getMyMatches(
  domainId: string
): Promise<{ incoming: BacklinkMatch[]; outgoing: BacklinkMatch[] }> {
  const { data: listing } = await supabaseAdmin
    .from("backlink_listings")
    .select("id")
    .eq("domain_id", domainId)
    .maybeSingle();

  if (!listing) return { incoming: [], outgoing: [] };

  const [{ data: incoming }, { data: outgoing }] = await Promise.all([
    supabaseAdmin
      .from("backlink_matches")
      .select("*")
      .eq("target_listing_id", listing.id)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("backlink_matches")
      .select("*")
      .eq("requester_listing_id", listing.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    incoming: incoming ?? [],
    outgoing: outgoing ?? [],
  };
}

export async function getExchangeStats(domainId: string) {
  const { data: listing } = await supabaseAdmin
    .from("backlink_listings")
    .select("id")
    .eq("domain_id", domainId)
    .maybeSingle();

  if (!listing) return { totalMatches: 0, completedLinks: 0, pendingRequests: 0 };

  const [{ count: total }, { count: completed }, { count: pending }] = await Promise.all([
    supabaseAdmin
      .from("backlink_matches")
      .select("id", { count: "exact", head: true })
      .or(`requester_listing_id.eq.${listing.id},target_listing_id.eq.${listing.id}`),
    supabaseAdmin
      .from("backlink_matches")
      .select("id", { count: "exact", head: true })
      .or(`requester_listing_id.eq.${listing.id},target_listing_id.eq.${listing.id}`)
      .eq("status", "completed"),
    supabaseAdmin
      .from("backlink_matches")
      .select("id", { count: "exact", head: true })
      .eq("target_listing_id", listing.id)
      .eq("status", "pending"),
  ]);

  return {
    totalMatches: total ?? 0,
    completedLinks: completed ?? 0,
    pendingRequests: pending ?? 0,
  };
}
