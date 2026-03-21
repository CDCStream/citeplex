/**
 * Client-only analytics helpers (gtag). Respects marketing cookie consent.
 */

import { COOKIE_CONSENT_KEY } from "@/components/cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasMarketingConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

/** Subscribe to consent changes (e.g. fire delayed conversions after Accept). */
export function subscribeMarketingConsent(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onAccept = () => cb();
  window.addEventListener("citeplex:cookie-accepted", onAccept);
  return () => window.removeEventListener("citeplex:cookie-accepted", onAccept);
}

export function gtagEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (!hasMarketingConsent() || typeof window === "undefined") return;
  window.gtag?.("event", name, params);
}

/**
 * Google Ads conversion (create in Google Ads → Goals → Conversions → Website).
 * Env: NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_SEND_TO = AW-XXXXXXXXXX/YYYYYYYYYY
 */
export function googleAdsConversion(
  sendTo: string,
  params?: { value?: number; currency?: string; transaction_id?: string },
): void {
  if (!sendTo || !hasMarketingConsent() || typeof window === "undefined") return;
  window.gtag?.("event", "conversion", {
    send_to: sendTo,
    ...params,
  });
}
