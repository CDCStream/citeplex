import type { VideoConfig } from "./types";

/**
 * Example: YouTube long-form demo showcasing the onboarding flow.
 *
 * Usage:
 *   1. Record your screen performing the onboarding in Citeplex
 *   2. Save the recording to  video/public/marketing/onboarding-demo.mp4
 *   3. (Optional) Export a HeyGen avatar video to  video/public/marketing/avatar-intro.mp4
 *   4. Adjust the cursor keyframes and zoom points to match your recording
 *   5. Preview in Remotion Studio, then render:
 *      npx remotion render OnboardingDemo out/youtube-onboarding.mp4
 */
export const onboardingDemo: VideoConfig = {
  id: "OnboardingDemo",
  title: "How to Set Up AI Visibility Tracking in 60 Seconds",
  format: "youtube",
  fps: 30,
  heygenVideo: "marketing/avatar-intro.mp4",
  heygenPosition: "bottomRight",
  heygenSize: 220,
  heygenEnterFrame: 0,
  heygenVolume: 1,
  scenes: [
    {
      type: "screen",
      screenRecording: "marketing/onboarding-demo.mp4",
      duration: 300,
      showChrome: true,
      cursor: [
        { frame: 30, x: 960, y: 400 },
        { frame: 60, x: 960, y: 450, click: true },
        { frame: 120, x: 500, y: 300 },
        { frame: 150, x: 500, y: 350, click: true },
        { frame: 220, x: 1200, y: 600, click: true },
      ],
      zoom: [
        { frame: 55, x: 960, y: 450, scale: 2, easeIn: 15, hold: 40, easeOut: 15 },
        { frame: 145, x: 500, y: 350, scale: 2.5, easeIn: 15, hold: 50, easeOut: 15 },
      ],
      textOverlays: [
        { text: "Enter your website URL", frame: 10, duration: 50, position: "top", fontSize: 36 },
        { text: "Add your competitors", frame: 100, duration: 60, position: "top", fontSize: 36 },
        { text: "Start tracking!", frame: 200, duration: 60, position: "top", fontSize: 40 },
      ],
    },
  ],
};

/**
 * Example: TikTok/Shorts vertical video highlighting AI visibility.
 */
export const aiVisibilityShort: VideoConfig = {
  id: "AIVisibilityShort",
  title: "Track Your Brand in AI Search",
  format: "shorts",
  fps: 30,
  heygenVideo: "marketing/avatar-short.mp4",
  heygenPosition: "bottomLeft",
  heygenSize: 260,
  heygenEnterFrame: 0,
  heygenVolume: 1,
  scenes: [
    {
      type: "screen",
      screenRecording: "marketing/ai-visibility-demo.mp4",
      duration: 900,
      showChrome: true,
      cursor: [
        { frame: 60, x: 540, y: 300, click: true },
        { frame: 180, x: 300, y: 500 },
        { frame: 240, x: 700, y: 400, click: true },
      ],
      zoom: [
        { frame: 55, x: 540, y: 300, scale: 2.5, easeIn: 12, hold: 60, easeOut: 12 },
        { frame: 235, x: 700, y: 400, scale: 2, easeIn: 12, hold: 45, easeOut: 12 },
      ],
      textOverlays: [
        { text: "See where AI mentions your brand", frame: 0, duration: 90, position: "top", fontSize: 28 },
        { text: "Track competitors too!", frame: 150, duration: 90, position: "top", fontSize: 28 },
      ],
    },
  ],
};
