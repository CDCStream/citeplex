"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  gtagEvent,
  googleAdsConversion,
  hasMarketingConsent,
  subscribeMarketingConsent,
} from "@/lib/analytics";

const SESSION_KEY = "citeplex_ga_purchase_fired";

function firePurchase(checkoutId: string | undefined) {
  if (sessionStorage.getItem(SESSION_KEY)) return;
  sessionStorage.setItem(SESSION_KEY, "1");

  gtagEvent("purchase", {
    transaction_id: checkoutId ?? `sub_${Date.now()}`,
    value: 1,
    currency: "USD",
    items: [{ item_name: "Citeplex subscription", item_category: "subscription" }],
  });

  const sendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_SEND_TO;
  if (sendTo) {
    googleAdsConversion(sendTo, {
      value: 1,
      currency: "USD",
      transaction_id: checkoutId,
    });
  }
}

/**
 * Fires GA4 `purchase` + optional Google Ads conversion once per session (after cookie consent).
 */
export function CheckoutPurchaseConversion() {
  const searchParams = useSearchParams();
  const [consented, setConsented] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    setConsented(hasMarketingConsent());
    return subscribeMarketingConsent(() => setConsented(hasMarketingConsent()));
  }, []);

  useEffect(() => {
    if (!consented) return;
    if (fired.current) return;
    fired.current = true;

    const checkoutId =
      searchParams.get("checkout_id") ??
      searchParams.get("checkoutId") ??
      undefined;

    firePurchase(checkoutId);
  }, [consented, searchParams]);

  return null;
}
