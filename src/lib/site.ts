/** Canonical public site URL (no trailing slash). Prefer NEXT_PUBLIC_APP_URL in production. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.citeplex.io";
  return raw.replace(/\/$/, "");
}
