"use client";

import { resetCookieConsent } from "@/components/cookie-consent";

export function CookieSettingsButton() {
  return (
    <button
      onClick={resetCookieConsent}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Cookie Settings
    </button>
  );
}
