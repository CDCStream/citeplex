import { create } from "zustand";
import type { VideoConfig, SceneConfig } from "@remotion/videos/types";
import { defaultVideoConfig, createSceneByType } from "@/lib/default-configs";

interface EditorState {
  config: VideoConfig;
  selectedSceneIndex: number;
  isRendering: boolean;
  renderProgress: number;
  renderLogs: string[];

  /* Scene actions */
  addScene: (type: SceneConfig["type"], atIndex?: number) => void;
  removeScene: (index: number) => void;
  moveScene: (fromIndex: number, toIndex: number) => void;
  selectScene: (index: number) => void;
  updateScene: (index: number, patch: Partial<SceneConfig>) => void;
  duplicateScene: (index: number) => void;

  /* Global config actions */
  updateGlobal: (patch: Partial<VideoConfig>) => void;
  setConfig: (config: VideoConfig) => void;
  resetConfig: () => void;

  /* Render state */
  setRendering: (isRendering: boolean) => void;
  setRenderProgress: (progress: number) => void;
  addRenderLog: (log: string) => void;
  clearRenderLogs: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  config: defaultVideoConfig,
  selectedSceneIndex: 0,
  isRendering: false,
  renderProgress: 0,
  renderLogs: [],

  addScene: (type, atIndex) =>
    set((state) => {
      const newScene = createSceneByType(type);
      const scenes = [...state.config.scenes];
      const insertAt = atIndex ?? scenes.length;
      scenes.splice(insertAt, 0, newScene);
      return {
        config: { ...state.config, scenes },
        selectedSceneIndex: insertAt,
      };
    }),

  removeScene: (index) =>
    set((state) => {
      if (state.config.scenes.length <= 1) return state;
      const scenes = state.config.scenes.filter((_, i) => i !== index);
      const newSelected = Math.min(
        state.selectedSceneIndex,
        scenes.length - 1
      );
      return {
        config: { ...state.config, scenes },
        selectedSceneIndex: newSelected,
      };
    }),

  moveScene: (fromIndex, toIndex) =>
    set((state) => {
      const scenes = [...state.config.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      return {
        config: { ...state.config, scenes },
        selectedSceneIndex: toIndex,
      };
    }),

  selectScene: (index) => set({ selectedSceneIndex: index }),

  updateScene: (index, patch) =>
    set((state) => {
      const scenes = state.config.scenes.map((scene, i) => {
        if (i !== index) return scene;
        return { ...scene, ...patch } as SceneConfig;
      });
      return { config: { ...state.config, scenes } };
    }),

  duplicateScene: (index) =>
    set((state) => {
      const scenes = [...state.config.scenes];
      const clone = { ...scenes[index] };
      scenes.splice(index + 1, 0, clone);
      return {
        config: { ...state.config, scenes },
        selectedSceneIndex: index + 1,
      };
    }),

  updateGlobal: (patch) =>
    set((state) => ({
      config: { ...state.config, ...patch, scenes: state.config.scenes },
    })),

  setConfig: (config) =>
    set({ config, selectedSceneIndex: 0 }),

  resetConfig: () =>
    set({ config: defaultVideoConfig, selectedSceneIndex: 0 }),

  setRendering: (isRendering) => set({ isRendering }),
  setRenderProgress: (renderProgress) => set({ renderProgress }),
  addRenderLog: (log) =>
    set((state) => ({ renderLogs: [...state.renderLogs, log] })),
  clearRenderLogs: () => set({ renderLogs: [], renderProgress: 0 }),
}));
