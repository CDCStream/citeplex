"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "citeplex_cookie_consent";

export const COOKIE_CONSENT_KEY = CONSENT_KEY;

export function resetCookieConsent() {
  localStorage.removeItem(CONSENT_KEY);
  window.dispatchEvent(new Event("citeplex:reset-cookies"));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleReset = () => setVisible(true);
    window.addEventListener("citeplex:reset-cookies", handleReset);
    return () => window.removeEventListener("citeplex:reset-cookies", handleReset);
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-start gap-4 p-5 sm:p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold">We value your privacy</h3>
              <button
                onClick={decline}
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              We use <strong>essential cookies</strong> for authentication and core
              functionality (these cannot be disabled). <strong>Analytics cookies</strong> help
              us understand how you use our platform and are only enabled with your
              consent. See our{" "}
              <Link href="/privacy#cookies" className="font-medium text-primary hover:underline">
                Cookie Policy
              </Link>{" "}
              for full details.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={accept} className="h-8 rounded-lg text-xs">
                Accept All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={decline}
                className="h-8 rounded-lg text-xs"
              >
                Reject All
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
