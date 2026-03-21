"use client";

import Image from "next/image";
import { useState } from "react";
import { Globe } from "lucide-react";

function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

export function Favicon({
  url,
  size = 20,
  className = "",
}: {
  url: string;
  size?: number;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const domain = extractDomain(url);
  const src = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`;

  if (error) {
    return <Globe className={className} style={{ width: size, height: size }} />;
  }

  return (
    <Image
      src={src}
      alt={domain}
      width={size}
      height={size}
      className={`shrink-0 rounded-sm ${className}`}
      onError={() => setError(true)}
      unoptimized
    />
  );
}
