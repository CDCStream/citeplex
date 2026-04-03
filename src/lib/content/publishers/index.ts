import type { PublishAdapter, PublishPayload, PublishResult } from "./types";

class WordPressAdapter implements PublishAdapter {
  platform = "wordpress";

  async publish(
    payload: PublishPayload,
    config: Record<string, unknown>
  ): Promise<PublishResult> {
    const { siteUrl, username, appPassword } = config as {
      siteUrl: string;
      username: string;
      appPassword: string;
    };

    const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${username}:${appPassword}`)}`,
      },
      body: JSON.stringify({
        title: payload.title,
        slug: payload.slug,
        content: payload.content,
        status: payload.status === "published" ? "publish" : "draft",
        excerpt: payload.metaDescription || "",
        featured_media: undefined,
      }),
    });

    if (!res.ok) {
      return { success: false, error: `WordPress API error: ${res.status}` };
    }

    const data = await res.json();
    return { success: true, url: data.link, externalId: String(data.id) };
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    const { siteUrl, username, appPassword } = config as {
      siteUrl: string;
      username: string;
      appPassword: string;
    };
    try {
      const res = await fetch(`${siteUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Basic ${btoa(`${username}:${appPassword}`)}`,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

class GhostAdapter implements PublishAdapter {
  platform = "ghost";

  async publish(
    payload: PublishPayload,
    config: Record<string, unknown>
  ): Promise<PublishResult> {
    const { apiUrl, adminApiKey } = config as {
      apiUrl: string;
      adminApiKey: string;
    };

    const [id, secret] = adminApiKey.split(":");
    const token = await this.createToken(id, secret);

    const res = await fetch(`${apiUrl}/ghost/api/admin/posts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Ghost ${token}`,
      },
      body: JSON.stringify({
        posts: [
          {
            title: payload.title,
            slug: payload.slug,
            html: payload.content,
            meta_description: payload.metaDescription || "",
            status: payload.status === "published" ? "published" : "draft",
            tags: (payload.tags || []).map((t) => ({ name: t })),
            feature_image: payload.coverImage || undefined,
          },
        ],
      }),
    });

    if (!res.ok) {
      return { success: false, error: `Ghost API error: ${res.status}` };
    }

    const data = await res.json();
    const post = data.posts?.[0];
    return {
      success: true,
      url: post?.url,
      externalId: post?.id,
    };
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    try {
      const { apiUrl, adminApiKey } = config as {
        apiUrl: string;
        adminApiKey: string;
      };
      const [id, secret] = adminApiKey.split(":");
      const token = await this.createToken(id, secret);
      const res = await fetch(`${apiUrl}/ghost/api/admin/site/`, {
        headers: { Authorization: `Ghost ${token}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async createToken(id: string, secret: string): Promise<string> {
    // Ghost Admin API uses JWT with HS256
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT", kid: id }));
    const now = Math.floor(Date.now() / 1000);
    const payload = btoa(
      JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" })
    );
    const data = `${header}.${payload}`;

    const keyBytes = new Uint8Array(
      (secret.match(/.{1,2}/g) || []).map((byte) => parseInt(byte, 16))
    );
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    return `${data}.${sigB64}`;
  }
}

class WebhookAdapter implements PublishAdapter {
  platform = "webhook";

  async publish(
    payload: PublishPayload,
    config: Record<string, unknown>
  ): Promise<PublishResult> {
    const { webhookUrl, secret } = config as {
      webhookUrl: string;
      secret?: string;
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (secret) headers["X-Webhook-Secret"] = secret;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `Webhook error: ${res.status}` };
    }

    return { success: true };
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    try {
      const { webhookUrl } = config as { webhookUrl: string };
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

class GenericApiAdapter implements PublishAdapter {
  platform: string;

  constructor(platform: string) {
    this.platform = platform;
  }

  async publish(
    payload: PublishPayload,
    config: Record<string, unknown>
  ): Promise<PublishResult> {
    const { apiUrl, apiKey } = config as {
      apiUrl: string;
      apiKey: string;
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return {
        success: false,
        error: `${this.platform} API error: ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      url: data.url || data.link,
      externalId: data.id || data.externalId,
    };
  }

  async test(config: Record<string, unknown>): Promise<boolean> {
    const { apiUrl, apiKey } = config as { apiUrl: string; apiKey: string };
    try {
      const res = await fetch(apiUrl, {
        method: "HEAD",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      return res.ok || res.status === 405;
    } catch {
      return false;
    }
  }
}

const adapters: Record<string, PublishAdapter> = {
  wordpress: new WordPressAdapter(),
  ghost: new GhostAdapter(),
  webhook: new WebhookAdapter(),
  notion: new GenericApiAdapter("notion"),
  webflow: new GenericApiAdapter("webflow"),
  shopify: new GenericApiAdapter("shopify"),
  wix: new GenericApiAdapter("wix"),
  framer: new GenericApiAdapter("framer"),
  feather: new GenericApiAdapter("feather"),
};

export function getAdapter(platform: string): PublishAdapter | null {
  return adapters[platform] || null;
}

export const PLATFORM_CONFIG_FIELDS: Record<
  string,
  { key: string; label: string; type: "text" | "password"; placeholder: string }[]
> = {
  wordpress: [
    { key: "siteUrl", label: "Site URL", type: "text", placeholder: "https://yoursite.com" },
    { key: "username", label: "Username", type: "text", placeholder: "admin" },
    { key: "appPassword", label: "Application Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
  ],
  ghost: [
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://yoursite.ghost.io" },
    { key: "adminApiKey", label: "Admin API Key", type: "password", placeholder: "id:secret" },
  ],
  notion: [
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://api.notion.com/v1/pages" },
    { key: "apiKey", label: "Integration Token", type: "password", placeholder: "secret_..." },
  ],
  webflow: [
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://api.webflow.com/v2/collections/.../items" },
    { key: "apiKey", label: "API Token", type: "password", placeholder: "" },
  ],
  shopify: [
    { key: "apiUrl", label: "Store Blog API URL", type: "text", placeholder: "https://store.myshopify.com/admin/api/2024-01/blogs/.../articles.json" },
    { key: "apiKey", label: "Access Token", type: "password", placeholder: "shpat_..." },
  ],
  wix: [
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://www.wixapis.com/blog/v3/posts" },
    { key: "apiKey", label: "API Key", type: "password", placeholder: "" },
  ],
  framer: [
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://api.framer.com/..." },
    { key: "apiKey", label: "API Key", type: "password", placeholder: "" },
  ],
  feather: [
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://api.feather.so/..." },
    { key: "apiKey", label: "API Key", type: "password", placeholder: "" },
  ],
  webhook: [
    { key: "webhookUrl", label: "Webhook URL", type: "text", placeholder: "https://..." },
    { key: "secret", label: "Secret (optional)", type: "password", placeholder: "" },
  ],
};

export const PLATFORM_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  notion: "Notion",
  webflow: "Webflow",
  shopify: "Shopify",
  wix: "Wix",
  ghost: "Ghost",
  framer: "Framer",
  feather: "Feather",
  webhook: "API Webhook",
};
