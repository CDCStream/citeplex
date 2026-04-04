"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, X, Pause, Play } from "lucide-react";

export function DemoVideo() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
    setIsPaused(false);
    document.body.style.overflow = "hidden";
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    document.body.style.overflow = "";
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen, closeFullscreen]);

  const togglePlayPause = useCallback(() => {
    const vid = fullscreenVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setIsPaused(false);
    } else {
      vid.pause();
      setIsPaused(true);
    }
  }, []);

  return (
    <>
      {/* Inline preview */}
      <div className="group relative mt-6 sm:mt-8 mx-auto w-full max-w-4xl overflow-hidden rounded-xl border shadow-2xl shadow-primary/10">
        <video
          src="/demo.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full"
        />
        <button
          onClick={openFullscreen}
          aria-label="Watch fullscreen"
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/80"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          Full Screen
        </button>
      </div>

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={closeFullscreen}
        >
          {/* Close button */}
          <button
            onClick={closeFullscreen}
            aria-label="Close fullscreen"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Video container */}
          <div
            className="relative w-full max-w-6xl px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              ref={fullscreenVideoRef}
              src="/demo.mp4"
              autoPlay
              loop
              playsInline
              className="w-full rounded-lg"
              onClick={togglePlayPause}
            />

            {/* Play/Pause overlay on click */}
            <button
              onClick={togglePlayPause}
              aria-label={isPaused ? "Play" : "Pause"}
              className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              {isPaused ? (
                <Play className="h-5 w-5 ml-0.5" />
              ) : (
                <Pause className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* ESC hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40">
            Press ESC or click outside to close
          </p>
        </div>
      )}
    </>
  );
}
