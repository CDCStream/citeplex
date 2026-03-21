import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import { GoogleAnalytics } from "@/components/google-analytics";
import { RouteProgress } from "@/components/route-progress";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
const ahrefsKey = process.env.NEXT_PUBLIC_AHREFS_WEB_ANALYTICS_KEY?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Citeplex — AI Search Visibility · 7 Engines · Daily Tracking · Half the Price",
  description:
    "Track your brand visibility across ChatGPT, Perplexity, Gemini & Claude. Get actionable recommendations to improve your AI search presence.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  ...(googleVerification
    ? { verification: { google: googleVerification } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} antialiased`}>
        {ahrefsKey ? (
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            strategy="beforeInteractive"
            {...{ "data-key": ahrefsKey }}
          />
        ) : null}
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
