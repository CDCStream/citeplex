export interface PublishPayload {
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  coverImage?: string;
  tags?: string[];
  faq?: { question: string; answer: string }[];
  status?: "draft" | "published";
}

export interface PublishResult {
  success: boolean;
  url?: string;
  externalId?: string;
  error?: string;
}

export interface PublishAdapter {
  platform: string;
  publish(
    payload: PublishPayload,
    config: Record<string, unknown>
  ): Promise<PublishResult>;
  test(config: Record<string, unknown>): Promise<boolean>;
}
