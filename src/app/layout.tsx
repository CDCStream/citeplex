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
  title: "Citeplex — Boost your SEO, AEO & GEO from one platform",
  description:
    "Monitor AI engines, find competitor gaps, write SEO-optimized articles with AI, and publish automatically. Track your brand across ChatGPT, Gemini, Claude, Perplexity & more.",
  openGraph: {
    siteName: "Citeplex",
    title: "Citeplex — Boost your SEO, AEO & GEO from one platform",
    description:
      "Monitor AI engines, find competitor gaps, write SEO-optimized articles with AI, and publish automatically.",
    type: "website",
    url: getSiteUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Citeplex — Boost your SEO, AEO & GEO from one platform",
    description:
      "Monitor AI engines, find competitor gaps, write SEO-optimized articles with AI, and publish automatically.",
  },
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
      <head>
        <script
          src="https://seo-fixer.writesonic.com/site-audit/fixer-script/index.js"
          id="wsAiSeoMb"
          type="application/javascript"
        />
        <script
          id="wsAiSeoInitScript"
          dangerouslySetInnerHTML={{
            __html: `wsSEOfixer.configure({hostURL:'https://seo-fixer.writesonic.com',siteID:'69c695c155b8ec7751502a36'});`,
          }}
        />
      </head>
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
