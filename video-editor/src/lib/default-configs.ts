import type {
  VideoConfig,
  SceneConfig,
  TitleScene,
  ScreenScene,
  AvatarScene,
  SplitScene,
} from "@video/videos/types";

export function createTitleScene(overrides?: Partial<TitleScene>): TitleScene {
  return {
    type: "title",
    duration: 90,
    title: "Your Title Here",
    subtitle: "",
    showLogo: true,
    backgroundVariant: "default",
    ...overrides,
  };
}

export function createScreenScene(
  overrides?: Partial<ScreenScene>
): ScreenScene {
  return {
    type: "screen",
    duration: 300,
    screenRecording: "",
    showChrome: true,
    cursor: [],
    zoom: [],
    textOverlays: [],
    volume: 0,
    ...overrides,
  };
}

export function createAvatarScene(
  overrides?: Partial<AvatarScene>
): AvatarScene {
  return {
    type: "avatar",
    duration: 300,
    src: "",
    volume: 1,
    backgroundVariant: "default",
    subtitles: [],
    ...overrides,
  };
}

export function createSplitScene(overrides?: Partial<SplitScene>): SplitScene {
  return {
    type: "split",
    duration: 300,
    avatarSrc: "",
    avatarVolume: 1,
    screenRecording: "",
    showChrome: true,
    avatarRatio: 0.4,
    direction: "horizontal",
    cursor: [],
    zoom: [],
    textOverlays: [],
    ...overrides,
  };
}

export function createSceneByType(type: SceneConfig["type"]): SceneConfig {
  switch (type) {
    case "title":
      return createTitleScene();
    case "screen":
      return createScreenScene();
    case "avatar":
      return createAvatarScene();
    case "split":
      return createSplitScene();
  }
}

export const defaultVideoConfig: VideoConfig = {
  id: "NewVideo",
  title: "New Marketing Video",
  format: "youtube",
  fps: 30,
  transitionDuration: 15,
  scenes: [
    createTitleScene({ title: "Welcome to Citeplex", subtitle: "AI-Powered SEO Platform" }),
    createScreenScene({ duration: 450 }),
    createTitleScene({
      title: "Try Citeplex Free",
      subtitle: "14-day trial — Plans from $69/mo",
      backgroundVariant: "warm",
    }),
  ],
};
