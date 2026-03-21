import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return [
    { url: base, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/pricing`, lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
}
