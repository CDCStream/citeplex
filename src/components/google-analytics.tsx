"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { COOKIE_CONSENT_KEY } from "@/components/cookie-consent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(false);

  const syncConsent = useCallback(() => {
    setConsented(hasAnalyticsConsent());
  }, []);

  useEffect(() => {
    syncConsent();
    window.addEventListener("citeplex:cookie-accepted", syncConsent);
    return () => window.removeEventListener("citeplex:cookie-accepted", syncConsent);
  }, [syncConsent]);

  useEffect(() => {
    if (!consented || !GA_ID || typeof window === "undefined") return;
    const url =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag?.("config", GA_ID, {
      page_path: url,
    });
  }, [pathname, searchParams, consented]);

  if (!GA_ID || !consented) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
