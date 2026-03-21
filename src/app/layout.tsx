import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CookieConsent } from "@/components/cookie-consent";
import { RouteProgress } from "@/components/route-progress";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Citeplex — AI Search Visibility · 7 Engines · Daily Tracking · Half the Price",
  description:
    "Track your brand visibility across ChatGPT, Perplexity, Gemini & Claude. Get actionable recommendations to improve your AI search presence.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
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
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
