import { createClient } from "@supabase/supabase-js";
import type { BlogPostRow } from "@/types/blog";

function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function getPublishedBlogPosts(): Promise<BlogPostRow[]> {
  const supabase = getAnonClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as BlogPostRow[];
}

export async function getPublishedPostBySlug(
  slug: string,
): Promise<BlogPostRow | null> {
  const clean = slug.trim();
  if (!clean) return null;

  const supabase = getAnonClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", clean)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return (data as BlogPostRow | null) ?? null;
}
