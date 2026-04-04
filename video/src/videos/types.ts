import type { CursorKeyframe } from "../components/AnimatedCursor";
import type { ZoomKeyframe } from "../components/ZoomEffect";
import type { TextOverlayConfig } from "../components/ScreenRecordingPlayer";
import type { PiPPosition } from "../components/HeyGenPiP";

/* ── Scene base ── */

interface SceneBase {
  duration: number;
}

/* ── Avatar Scene: full-screen HeyGen video ── */

export interface AvatarScene extends SceneBase {
  type: "avatar";
  /** HeyGen video path relative to video/public/ */
  src: string;
  volume?: number;
  startFrom?: number;
  /** Gradient background variant behind the avatar */
  backgroundVariant?: "default" | "warm" | "cool" | "danger";
  /** Optional name card overlay */
  nameCard?: { name: string; title?: string };
  /** Show subtitles (text overlays timed to speech) */
  subtitles?: TextOverlayConfig[];
}

/* ── Screen Scene: screen recording + cursor + zoom ── */

export interface ScreenScene extends SceneBase {
  type: "screen";
  /** Screen recording path relative to video/public/ */
  screenRecording: string;
  cursor?: CursorKeyframe[];
  zoom?: ZoomKeyframe[];
  textOverlays?: TextOverlayConfig[];
  showChrome?: boolean;
  volume?: number;
  playbackRate?: number;
  startFrom?: number;
}

/* ── Title Scene: intro / outro / interstitial card ── */

export interface TitleScene extends SceneBase {
  type: "title";
  title: string;
  subtitle?: string;
  /** Show Citeplex logo */
  showLogo?: boolean;
  backgroundVariant?: "default" | "warm" | "cool" | "danger";
  titleFontSize?: number;
  subtitleFontSize?: number;
}

/* ── Split Scene: avatar + screen recording side by side ── */

export interface SplitScene extends SceneBase {
  type: "split";
  /** Avatar video path */
  avatarSrc: string;
  avatarVolume?: number;
  /** Screen recording path */
  screenRecording: string;
  cursor?: CursorKeyframe[];
  zoom?: ZoomKeyframe[];
  textOverlays?: TextOverlayConfig[];
  showChrome?: boolean;
  /** Avatar portion ratio 0-1 (default 0.4 = 40% avatar, 60% screen) */
  avatarRatio?: number;
  /** Layout direction for shorts */
  direction?: "horizontal" | "vertical";
}

/* ── Union type ── */

export type SceneConfig = AvatarScene | ScreenScene | TitleScene | SplitScene;

/* ── Video config ── */

export interface VideoConfig {
  id: string;
  title: string;
  format: "youtube" | "shorts";
  fps?: number;
  /** Global HeyGen PiP overlay (independent of scenes) */
  heygenVideo?: string;
  heygenPosition?: PiPPosition;
  heygenSize?: number;
  heygenEnterFrame?: number;
  heygenExitFrame?: number;
  heygenVolume?: number;
  /** Background music path relative to video/public/ */
  backgroundMusic?: string;
  backgroundMusicVolume?: number;
  /** Transition duration in frames between scenes (default 15) */
  transitionDuration?: number;
  scenes: SceneConfig[];
}

/* ── Helpers ── */

export function getTotalDuration(config: VideoConfig): number {
  const transition = config.transitionDuration ?? 15;
  const rawDuration = config.scenes.reduce((sum, s) => sum + s.duration, 0);
  const overlapCount = Math.max(0, config.scenes.length - 1);
  return rawDuration - overlapCount * transition;
}

export function getResolution(format: "youtube" | "shorts") {
  return format === "shorts"
    ? { width: 1080, height: 1920 }
    : { width: 1920, height: 1080 };
}
