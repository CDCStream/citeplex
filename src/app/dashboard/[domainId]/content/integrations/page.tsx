"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plug,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";

const PLATFORM_LABELS: Record<string, string> = {
  wordpress: "WordPress",
  notion: "Notion",
  webflow: "Webflow",
  shopify: "Shopify",
  wix: "Wix",
  ghost: "Ghost",
  framer: "Framer",
  feather: "Feather",
  webhook: "API Webhook",
  citeplex: "Citeplex Blog",
};

const PLATFORM_CONFIG_FIELDS: Record<
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
    { key: "apiUrl", label: "API URL", type: "text", placeholder: "https://api.feather.blog/..." },
    { key: "apiKey", label: "API Key", type: "password", placeholder: "" },
  ],
  webhook: [
    { key: "webhookUrl", label: "Webhook URL", type: "text", placeholder: "https://hooks.example.com/publish" },
  ],
  citeplex: [],
};

const ALL_PLATFORMS = Object.keys(PLATFORM_LABELS);

interface Integration {
  id: string;
  platform: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export default function IntegrationsPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch(`/api/content/${domainId}/integrations`);
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load integrations" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId]);

  const connectedPlatforms = integrations.map((i) => i.platform);
  const availablePlatforms = ALL_PLATFORMS.filter((p) => !connectedPlatforms.includes(p));

  const handleSave = async () => {
    if (!selectedPlatform) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/content/${domainId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: selectedPlatform, config: configValues }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.testResult) {
        setMessage({ type: "success", text: `${PLATFORM_LABELS[selectedPlatform]} connected successfully!` });
      } else {
        setMessage({ type: "error", text: `${PLATFORM_LABELS[selectedPlatform]} saved but connection test failed. Check your credentials.` });
      }

      setShowAdd(false);
      setSelectedPlatform("");
      setConfigValues({});
      fetchIntegrations();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (platform: string) => {
    setDeleting(platform);
    setMessage(null);
    try {
      const res = await fetch(`/api/content/${domainId}/integrations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setMessage({ type: "success", text: `${PLATFORM_LABELS[platform]} disconnected.` });
      fetchIntegrations();
    } catch (err) {
      setMessage({ type: "error", text: (err as Error).message });
    } finally {
      setDeleting(null);
    }
  };

  const fields = selectedPlatform ? PLATFORM_CONFIG_FIELDS[selectedPlatform] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect platforms to auto-publish your AI-generated articles.
          </p>
        </div>
        {availablePlatforms.length > 0 && (
          <button
            onClick={() => { setShowAdd(true); setMessage(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Integration
          </button>
        )}
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Integration Form */}
      {showAdd && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Connect a New Platform</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => { setSelectedPlatform(e.target.value); setConfigValues({}); }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a platform...</option>
              {availablePlatforms.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </div>

          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium mb-1.5">{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={configValues[field.key] || ""}
                onChange={(e) =>
                  setConfigValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          ))}

          {selectedPlatform === "citeplex" && (
            <p className="text-sm text-muted-foreground">
              No configuration needed — articles will be published to your Citeplex blog automatically.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={!selectedPlatform || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              {saving ? "Connecting..." : "Connect & Test"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setSelectedPlatform(""); setConfigValues({}); }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connected Integrations */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length === 0 && !showAdd ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Plug className="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No Integrations Yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Connect a platform to start auto-publishing your articles.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Integration
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {integrations.map((intg) => (
            <div
              key={intg.id}
              className="rounded-xl border bg-card p-5 flex items-start justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {PLATFORM_LABELS[intg.platform] || intg.platform}
                  </span>
                  {intg.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(intg.created_at).toLocaleDateString()}
                </p>
                {intg.platform !== "citeplex" && intg.config && (
                  <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                    {(intg.config as Record<string, string>).siteUrl ||
                      (intg.config as Record<string, string>).apiUrl ||
                      (intg.config as Record<string, string>).webhookUrl ||
                      ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {intg.platform !== "citeplex" && (intg.config as Record<string, string>).siteUrl && (
                  <a
                    href={(intg.config as Record<string, string>).siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(intg.platform)}
                  disabled={deleting === intg.platform}
                  className="rounded-lg p-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-muted-foreground hover:text-red-600"
                >
                  {deleting === intg.platform ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
