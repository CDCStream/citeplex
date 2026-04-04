"use client";

import { useMemo } from "react";
import { Player } from "@remotion/player";
import { useEditorStore } from "@/store/editor-store";
import { getTotalDuration, getResolution } from "@video/videos/types";
import { YouTubeTemplate } from "@video/templates/YouTubeTemplate";
import { ShortsTemplate } from "@video/templates/ShortsTemplate";
import type { VideoConfig } from "@video/videos/types";

function DynamicVideoComponent({ config }: { config: VideoConfig }) {
  if (config.format === "shorts") {
    return <ShortsTemplate config={config} />;
  }
  return <YouTubeTemplate config={config} />;
}

export function PreviewPanel() {
  const config = useEditorStore((s) => s.config);

  const { width, height } = useMemo(
    () => getResolution(config.format),
    [config.format]
  );
  const fps = config.fps ?? 30;
  const durationInFrames = useMemo(
    () => Math.max(1, getTotalDuration(config)),
    [config]
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full h-full">
      <div
        className="relative rounded-lg overflow-hidden shadow-2xl border border-border bg-black"
        style={{
          width: "100%",
          maxWidth: config.format === "shorts" ? 360 : 720,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        <Player
          component={DynamicVideoComponent}
          inputProps={{ config }}
          durationInFrames={durationInFrames}
          compositionWidth={width}
          compositionHeight={height}
          fps={fps}
          controls
          style={{ width: "100%", height: "100%" }}
          autoPlay={false}
        />
      </div>

      <div className="text-[10px] text-text-muted text-center">
        {width}x{height} &middot; {fps}fps &middot; {(durationInFrames / fps).toFixed(1)}s
      </div>
    </div>
  );
}
