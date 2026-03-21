export interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content: string | null;
  author: string | null;
  image: string | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
  updated_at: string | null;
}

export interface ParsedBlogPost {
  slug: string;
  title: string;
  description: string | null;
  content: string;
  author: string;
  image: string | null;
  tags: string[];
  published_at: string | null;
}
