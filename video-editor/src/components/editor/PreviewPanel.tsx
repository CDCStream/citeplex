"use client";

import { useMemo } from "react";
import { Player } from "@remotion/player";
import { useEditorStore } from "@/store/editor-store";
import { getTotalDuration, getResolution } from "@remotion/videos/types";
import { YouTubeTemplate } from "@remotion/templates/YouTubeTemplate";
import { ShortsTemplate } from "@remotion/templates/ShortsTemplate";
import type { VideoConfig } from "@remotion/videos/types";

function DynamicVideoComponent({ config }: { config: VideoConfig }) {
  if (config.format === "shorts") {
    return <ShortsTemplate config={config} />;
  }
  return <YouTubeTemplate config={config} />;
}

export function PreviewPanel() {
  const config = useEditorStore((s) => s.config);
  const renderLogs = useEditorStore((s) => s.renderLogs);
  const isRendering = useEditorStore((s) => s.isRendering);
  const renderProgress = useEditorStore((s) => s.renderProgress);

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

      {/* Render progress overlay */}
      {isRendering && (
        <div className="w-full max-w-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Rendering...</span>
            <span>{Math.round(renderProgress * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${renderProgress * 100}%` }}
            />
          </div>
          {renderLogs.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-md bg-surface-2 border border-border p-2 text-[10px] font-mono text-text-muted space-y-0.5">
              {renderLogs.slice(-20).map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
