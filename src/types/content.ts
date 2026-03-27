export interface KeywordMetrics {
  id: string;
  prompt_id: string;
  keyword: string;
  country: string;
  volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  traffic_potential: number | null;
  global_volume: number | null;
  parent_topic: string | null;
  fetched_at: string;
}

export type ArticleType =
  | "guide"
  | "how-to"
  | "listicle"
  | "comparison"
  | "explainer"
  | "round-up";

export type ContentPlanStatus = "planned" | "writing" | "review" | "published";

export interface ContentPlan {
  id: string;
  domain_id: string;
  title: string;
  keyword: string | null;
  article_type: ArticleType | null;
  scheduled_date: string;
  status: ContentPlanStatus;
  article_id: string | null;
  created_at: string;
}

export type ArticleStatus = "draft" | "review" | "approved" | "published";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface PublishRecord {
  platform: string;
  url: string;
  id: string;
}

export interface Article {
  id: string;
  domain_id: string;
  content_plan_id: string | null;
  title: string;
  slug: string;
  meta_description: string | null;
  cover_image: string | null;
  content: string | null;
  word_count: number;
  target_keyword: string | null;
  secondary_keywords: string[];
  tags: string[];
  outline: unknown[];
  research_data: Record<string, unknown>;
  faq: FaqItem[];
  seo_score: number | null;
  status: ArticleStatus;
  published_at: string | null;
  published_to: PublishRecord[];
  created_at: string;
  updated_at: string;
}

export type PublishPlatform =
  | "wordpress"
  | "notion"
  | "webflow"
  | "shopify"
  | "wix"
  | "ghost"
  | "framer"
  | "feather"
  | "webhook"
  | "citeplex";

export interface PublishIntegration {
  id: string;
  domain_id: string;
  platform: PublishPlatform;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}
