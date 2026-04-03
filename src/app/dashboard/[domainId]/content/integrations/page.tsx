"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import {
  Plug,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Webhook,
  BookOpen,
} from "lucide-react";

const PLATFORMS = [
  { key: "wordpress",  label: "WordPress",    logo: "https://cdn.simpleicons.org/wordpress/21759B" },
  { key: "notion",     label: "Notion",       logo: "https://cdn.simpleicons.org/notion/000000" },
  { key: "webflow",    label: "Webflow",      logo: "https://cdn.simpleicons.org/webflow/4353FF" },
  { key: "shopify",    label: "Shopify",      logo: "https://cdn.simpleicons.org/shopify/7AB55C" },
  { key: "wix",        label: "Wix",          logo: "https://cdn.simpleicons.org/wix/0C6EFC" },
  { key: "ghost",      label: "Ghost",        logo: "https://cdn.simpleicons.org/ghost/15171A" },
  { key: "framer",     label: "Framer",       logo: "https://cdn.simpleicons.org/framer/0055FF" },
  { key: "feather",    label: "Feather",      logo: null },
  { key: "webhook",    label: "API Webhook",  logo: null },
];

const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.label])
);

const PLATFORM_LOGOS: Record<string, string | null> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.logo])
);

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
    { key: "webhookUrl", label: "Webhook Endpoint", type: "text", placeholder: "https://hooks.example.com/publish" },
    { key: "accessToken", label: "Access Token", type: "password", placeholder: "your-secret-token" },
  ],
};

interface Integration {
  id: string;
  name: string;
  platform: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

function PlatformIcon({ platform, size = 36 }: { platform: string; size?: number }) {
  const logo = PLATFORM_LOGOS[platform];
  if (logo) {
    return (
      <Image
        src={logo}
        alt={PLATFORM_LABELS[platform]}
        width={size}
        height={size}
        className="dark:invert-0"
        unoptimized
      />
    );
  }
  if (platform === "webhook") return <Webhook className="text-muted-foreground" style={{ width: size, height: size }} />;
  if (platform === "feather") return <BookOpen className="text-muted-foreground" style={{ width: size, height: size }} />;
  return <Plug className="text-muted-foreground" style={{ width: size, height: size }} />;
}

export default function IntegrationsPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"list" | "select" | "config">("list");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [integrationName, setIntegrationName] = useState("");
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
  const availablePlatforms = PLATFORMS.filter((p) => !connectedPlatforms.includes(p.key));

  const handleSelectPlatform = (key: string) => {
    setSelectedPlatform(key);
    setIntegrationName("");
    setConfigValues({});
    setMessage(null);
    setStep("config");
  };

  const handleSave = async () => {
    if (!selectedPlatform) return;
    if (!integrationName.trim()) {
      setMessage({ type: "error", text: "Integration name is required." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/content/${domainId}/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: selectedPlatform, name: integrationName.trim(), config: configValues }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.testResult) {
        setMessage({ type: "success", text: `${PLATFORM_LABELS[selectedPlatform]} connected successfully!` });
      } else {
        setMessage({ type: "error", text: `${PLATFORM_LABELS[selectedPlatform]} saved but connection test failed. Check your credentials.` });
      }

      setStep("list");
      setSelectedPlatform("");
      setIntegrationName("");
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

  const resetFlow = () => {
    setStep("list");
    setSelectedPlatform("");
    setIntegrationName("");
    setConfigValues({});
  };

  const fields = selectedPlatform ? PLATFORM_CONFIG_FIELDS[selectedPlatform] || [] : [];

  // ───── Platform Selection Grid ─────
  if (step === "select") {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Add New Integration</h1>
          <p className="text-muted-foreground">
            Connect your website with Citeplex
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {availablePlatforms.map((p) => (
            <button
              key={p.key}
              onClick={() => handleSelectPlatform(p.key)}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-muted bg-card p-6 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
            >
              <PlatformIcon platform={p.key} size={40} />
              <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {p.label}
              </span>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={resetFlow}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to integrations
          </button>
        </div>
      </div>
    );
  }

  // ───── Config Form ─────
  if (step === "config" && selectedPlatform) {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <button
          onClick={() => setStep("select")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to platforms
        </button>

        <div className="rounded-xl border bg-card p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <PlatformIcon platform={selectedPlatform} size={32} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{PLATFORM_LABELS[selectedPlatform]}</h2>
              <p className="text-sm text-muted-foreground">Enter your connection details</p>
            </div>
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

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Integration Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder={`My ${PLATFORM_LABELS[selectedPlatform]} Integration`}
              value={integrationName}
              onChange={(e) => setIntegrationName(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
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
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
              {saving ? "Connecting..." : "Connect & Test"}
            </button>
            <button
              onClick={resetFlow}
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ───── Main List ─────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect platforms to auto-publish your AI-generated articles.
          </p>
        </div>
        {integrations.length === 0 && (
          <button
            onClick={() => { setStep("select"); setMessage(null); }}
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : integrations.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Plug className="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No Integrations Yet</h3>
          <p className="text-muted-foreground mt-1 mb-6">
            Connect a platform to start auto-publishing your articles.
          </p>
          <button
            onClick={() => setStep("select")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Integration
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {integrations.map((intg) => (
            <div
              key={intg.id}
              className="rounded-xl border bg-card p-5 flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted">
                <PlatformIcon platform={intg.platform} size={28} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {intg.name || PLATFORM_LABELS[intg.platform] || intg.platform}
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
                  {PLATFORM_LABELS[intg.platform]} · Added {new Date(intg.created_at).toLocaleDateString()}
                </p>
                {intg.config && (
                  <p className="text-xs text-muted-foreground truncate">
                    {(intg.config as Record<string, string>).siteUrl ||
                      (intg.config as Record<string, string>).apiUrl ||
                      (intg.config as Record<string, string>).webhookUrl ||
                      ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(intg.config as Record<string, string>).siteUrl && (
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
          <p className="text-xs text-muted-foreground text-center pt-2">
            You can have one active integration. Remove the current one to connect a different platform.
          </p>
        </div>
      )}
    </div>
  );
}
