"use client";

import { useEditorStore } from "@/store/editor-store";
import { getTotalDuration } from "@remotion/videos/types";
import type { SceneConfig } from "@remotion/videos/types";
import { useCallback, useRef, useState } from "react";

const SCENE_COLORS: Record<SceneConfig["type"], string> = {
  title: "bg-yellow-500/70",
  screen: "bg-blue-500/70",
  avatar: "bg-green-500/70",
  split: "bg-purple-500/70",
};

const SCENE_COLORS_SELECTED: Record<SceneConfig["type"], string> = {
  title: "bg-yellow-400",
  screen: "bg-blue-400",
  avatar: "bg-green-400",
  split: "bg-purple-400",
};

export function Timeline() {
  const scenes = useEditorStore((s) => s.config.scenes);
  const selectedIndex = useEditorStore((s) => s.selectedSceneIndex);
  const selectScene = useEditorStore((s) => s.selectScene);
  const updateScene = useEditorStore((s) => s.updateScene);
  const config = useEditorStore((s) => s.config);

  const totalFrames = scenes.reduce((sum, s) => sum + s.duration, 0);
  const fps = config.fps ?? 30;
  const totalDuration = getTotalDuration(config);
  const totalSeconds = totalDuration / fps;

  const containerRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState<{
    index: number;
    startX: number;
    startDuration: number;
  } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      e.preventDefault();
      setResizing({
        index,
        startX: e.clientX,
        startDuration: scenes[index].duration,
      });

      const handleMove = (me: MouseEvent) => {
        if (!containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth;
        const framesPerPixel = totalFrames / containerWidth;
        const dx = me.clientX - e.clientX;
        const frameDelta = Math.round(dx * framesPerPixel);
        const newDuration = Math.max(
          fps,
          scenes[index].duration + frameDelta
        );
        updateScene(index, { duration: newDuration });
      };

      const handleUp = () => {
        setResizing(null);
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    },
    [scenes, totalFrames, fps, updateScene]
  );

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-medium">
          Timeline
        </span>
        <span className="text-[10px] text-text-muted">
          {totalSeconds.toFixed(1)}s / {totalDuration} frames
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex h-10 w-full rounded-lg overflow-hidden border border-border"
      >
        {scenes.map((scene, index) => {
          const widthPercent = (scene.duration / totalFrames) * 100;
          const isSelected = index === selectedIndex;

          return (
            <div
              key={index}
              onClick={() => selectScene(index)}
              className={`relative flex items-center justify-center cursor-pointer transition-all group ${
                isSelected
                  ? SCENE_COLORS_SELECTED[scene.type]
                  : SCENE_COLORS[scene.type]
              } ${isSelected ? "ring-2 ring-white/30 ring-inset z-10" : ""}`}
              style={{ width: `${widthPercent}%`, minWidth: 24 }}
              title={`${scene.type} — ${(scene.duration / fps).toFixed(1)}s`}
            >
              <span className="text-[9px] font-medium text-white/80 truncate px-1 select-none">
                {scene.type === "title" ? (scene as any).title?.slice(0, 12) || "Title" : scene.type}
              </span>

              {/* Resize handle */}
              <div
                onMouseDown={(e) => handleResizeStart(e, index)}
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-white/0 hover:bg-white/30 transition-colors"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
