"use client";

import Image from "next/image";

const ENGINE_LOGOS: Record<string, string> = {
  chatgpt: "/engines/ChatGPT-Logo.png",
  perplexity: "/engines/perplexity-logo.png",
  gemini: "/engines/gemini-logo.png",
  claude: "/engines/claude-logo.png",
  deepseek: "/engines/deepseek-logo.png",
  grok: "/engines/grok-logo.png",
  mistral: "/engines/mistral-logo.png",
};

interface Props {
  engine: string;
  size?: number;
  className?: string;
}

const ENGINE_SCALE: Record<string, number> = {
  chatgpt: 2,
};

export function EngineIcon({ engine, size = 20, className = "" }: Props) {
  const src = ENGINE_LOGOS[engine];
  const scale = ENGINE_SCALE[engine] ?? 1;
  const renderSize = Math.round(size * scale);

  if (!src) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 rounded-md bg-gray-400 text-white text-xs font-bold ${className}`}
        style={{ width: size, height: size }}
      >
        {engine[0]?.toUpperCase()}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={engine}
      width={renderSize}
      height={renderSize}
      className={`shrink-0 rounded-sm object-contain ${className}`}
      unoptimized
    />
  );
}
