"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  gtagEvent,
  googleAdsConversion,
  hasMarketingConsent,
  subscribeMarketingConsent,
} from "@/lib/analytics";

const PENDING_KEY = "citeplex_pending_signup_conversion";

/**
 * New user: auth callback appends ?welcome=1 — fire sign_up once and strip query param.
 * If cookies not yet accepted, pending flag survives until consent (then fires).
 */
export function SignupConversion() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stripped = useRef(false);

  /* Strip welcome=1 from URL and remember pending conversion */
  useEffect(() => {
    if (stripped.current) return;
    if (searchParams.get("welcome") !== "1") return;
    stripped.current = true;
    sessionStorage.setItem(PENDING_KEY, "1");

    const path = window.location.pathname;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("welcome");
    const q = params.toString();
    router.replace(q ? `${path}?${q}` : path, { scroll: false });
  }, [searchParams, router]);

  /* Fire when consent available + pending */
  const fired = useRef(false);
  useEffect(() => {
    const tryFire = () => {
      if (fired.current) return;
      if (sessionStorage.getItem(PENDING_KEY) !== "1") return;
      if (!hasMarketingConsent()) return;
      fired.current = true;
      sessionStorage.removeItem(PENDING_KEY);

      gtagEvent("sign_up", { method: "oauth_or_email" });

      const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_SEND_TO;
      if (sendTo) {
        googleAdsConversion(sendTo);
      }
    };

    tryFire();
    return subscribeMarketingConsent(tryFire);
  }, []);

  return null;
}
