"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { COOKIE_CONSENT_KEY } from "@/components/cookie-consent";

const AHREFS_KEY = process.env.NEXT_PUBLIC_AHREFS_WEB_ANALYTICS_KEY?.trim();

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

export function AhrefsAnalytics() {
  const [consented, setConsented] = useState(false);

  const syncConsent = useCallback(() => {
    setConsented(hasAnalyticsConsent());
  }, []);

  useEffect(() => {
    syncConsent();
    window.addEventListener("citeplex:cookie-accepted", syncConsent);
    return () => window.removeEventListener("citeplex:cookie-accepted", syncConsent);
  }, [syncConsent]);

  if (!AHREFS_KEY || !consented) {
    return null;
  }

  return (
    <Script
      src="https://analytics.ahrefs.com/analytics.js"
      strategy="afterInteractive"
      {...{ "data-key": AHREFS_KEY }}
    />
  );
}
