import type { VideoConfig } from "./types";

/**
 * GEO Explainer — YouTube long-form marketing video.
 *
 * Flow:
 *   1. Title card — "What is GEO?"
 *   2. Avatar explains GEO concept (full-screen HeyGen)
 *   3. Screen recording — Citeplex demo showing GEO features
 *   4. Split view — Avatar explains while screen shows results
 *   5. CTA title card — "Try Citeplex Free"
 *
 * Before rendering:
 *   - Export HeyGen videos to video/public/marketing/
 *   - Record screen demos to video/public/marketing/
 *   - (Optional) Add background music to video/public/marketing/bg-music.mp3
 *   - Adjust cursor/zoom keyframes to match your recordings
 *
 * Render:
 *   npx remotion render GeoExplainer out/geo-explainer.mp4
 */
export const geoExplainer: VideoConfig = {
  id: "GeoExplainer",
  title: "What is GEO? — Generative Engine Optimization Explained",
  format: "youtube",
  fps: 30,
  backgroundMusic: "marketing/bg-music.mp3",
  backgroundMusicVolume: 0.12,
  transitionDuration: 20,
  scenes: [
    // Scene 1: Intro title card (3 seconds)
    {
      type: "title",
      duration: 90,
      title: "What is GEO?",
      subtitle: "Generative Engine Optimization",
      showLogo: true,
      backgroundVariant: "cool",
    },

    // Scene 2: Avatar explains GEO (10 seconds)
    {
      type: "avatar",
      duration: 300,
      src: "marketing/geo-intro.mp4",
      volume: 1,
      backgroundVariant: "default",
      nameCard: { name: "Citeplex", title: "AI SEO Platform" },
      subtitles: [
        { text: "GEO stands for Generative Engine Optimization", frame: 15, duration: 75, position: "bottom" },
        { text: "It's about getting your brand mentioned by AI search engines", frame: 100, duration: 80, position: "bottom" },
        { text: "Let me show you how Citeplex makes this easy...", frame: 210, duration: 70, position: "bottom" },
      ],
    },

    // Scene 3: Screen recording — Citeplex GEO dashboard (15 seconds)
    {
      type: "screen",
      duration: 450,
      screenRecording: "marketing/geo-demo.mp4",
      showChrome: true,
      cursor: [
        { frame: 30, x: 200, y: 100 },
        { frame: 60, x: 200, y: 150, click: true },
        { frame: 150, x: 960, y: 400 },
        { frame: 180, x: 960, y: 450, click: true },
        { frame: 300, x: 600, y: 300, click: true },
        { frame: 380, x: 1200, y: 500, click: true },
      ],
      zoom: [
        { frame: 55, x: 200, y: 150, scale: 2.5, easeIn: 15, hold: 50, easeOut: 15 },
        { frame: 175, x: 960, y: 450, scale: 2, easeIn: 15, hold: 60, easeOut: 15 },
        { frame: 295, x: 600, y: 300, scale: 2, easeIn: 12, hold: 40, easeOut: 12 },
      ],
      textOverlays: [
        { text: "Navigate to AI Visibility", frame: 10, duration: 60, position: "top", fontSize: 34 },
        { text: "See which AI engines mention you", frame: 120, duration: 80, position: "top", fontSize: 34 },
        { text: "Generate targeted content", frame: 270, duration: 80, position: "top", fontSize: 34 },
      ],
    },

    // Scene 4: Split view — avatar + results (10 seconds)
    {
      type: "split",
      duration: 300,
      avatarSrc: "marketing/geo-explain.mp4",
      avatarVolume: 1,
      screenRecording: "marketing/geo-results.mp4",
      showChrome: true,
      avatarRatio: 0.4,
      textOverlays: [
        { text: "Real-time AI visibility tracking", frame: 30, duration: 120, position: "bottom", fontSize: 24 },
      ],
    },

    // Scene 5: CTA title card (4 seconds)
    {
      type: "title",
      duration: 120,
      title: "Try Citeplex Free",
      subtitle: "14-day trial — Plans from $69/mo",
      showLogo: true,
      backgroundVariant: "warm",
      titleFontSize: 72,
    },
  ],
};

/**
 * GEO Explainer — TikTok/Shorts vertical version (30 seconds).
 */
export const geoShort: VideoConfig = {
  id: "GeoShort",
  title: "GEO in 30 Seconds",
  format: "shorts",
  fps: 30,
  transitionDuration: 12,
  scenes: [
    {
      type: "title",
      duration: 60,
      title: "What is GEO?",
      subtitle: "Generative Engine Optimization",
      titleFontSize: 64,
    },
    {
      type: "avatar",
      duration: 240,
      src: "marketing/geo-short-avatar.mp4",
      volume: 1,
      subtitles: [
        { text: "AI search engines are changing SEO forever", frame: 10, duration: 80, position: "bottom", fontSize: 22 },
        { text: "GEO helps you rank in ChatGPT, Gemini & more", frame: 100, duration: 90, position: "bottom", fontSize: 22 },
      ],
    },
    {
      type: "screen",
      duration: 360,
      screenRecording: "marketing/geo-demo-short.mp4",
      showChrome: true,
      cursor: [
        { frame: 30, x: 540, y: 400, click: true },
        { frame: 150, x: 540, y: 700, click: true },
      ],
      zoom: [
        { frame: 25, x: 540, y: 400, scale: 2.5, easeIn: 10, hold: 60, easeOut: 10 },
      ],
      textOverlays: [
        { text: "Track your AI visibility with Citeplex", frame: 0, duration: 90, position: "top", fontSize: 22 },
      ],
    },
    {
      type: "title",
      duration: 90,
      title: "Try Free — 14 Days",
      subtitle: "citeplex.io",
      showLogo: true,
      backgroundVariant: "warm",
      titleFontSize: 56,
    },
  ],
};
