import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import { AhrefsAnalytics } from "@/components/ahrefs-analytics";
import { GoogleAnalytics } from "@/components/google-analytics";
import { RouteProgress } from "@/components/route-progress";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

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
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <Suspense fallback={null}>
          <GoogleAnalytics />
          <AhrefsAnalytics />
        </Suspense>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
