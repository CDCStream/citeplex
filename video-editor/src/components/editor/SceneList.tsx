"use client";

import { useEditorStore } from "@/store/editor-store";
import type { SceneConfig } from "@video/videos/types";
import {
  Plus,
  Type,
  Monitor,
  User,
  LayoutPanelLeft,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { useState } from "react";

const SCENE_TYPE_META: Record<
  SceneConfig["type"],
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  title: { label: "Title Card", icon: Type, color: "text-yellow-400" },
  screen: { label: "Screen Recording", icon: Monitor, color: "text-blue-400" },
  avatar: { label: "Avatar", icon: User, color: "text-green-400" },
  split: { label: "Split View", icon: LayoutPanelLeft, color: "text-purple-400" },
};

export function SceneList() {
  const scenes = useEditorStore((s) => s.config.scenes);
  const selectedIndex = useEditorStore((s) => s.selectedSceneIndex);
  const selectScene = useEditorStore((s) => s.selectScene);
  const addScene = useEditorStore((s) => s.addScene);
  const removeScene = useEditorStore((s) => s.removeScene);
  const moveScene = useEditorStore((s) => s.moveScene);
  const duplicateScene = useEditorStore((s) => s.duplicateScene);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Scenes
        </span>
        <div className="relative">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          {showAdd && (
            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-lg border border-border bg-surface-2 py-1 shadow-xl">
              {(Object.keys(SCENE_TYPE_META) as SceneConfig["type"][]).map(
                (type) => {
                  const meta = SCENE_TYPE_META[type];
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        addScene(type);
                        setShowAdd(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-surface-3 transition-colors"
                    >
                      <meta.icon className={`h-3.5 w-3.5 ${meta.color}`} />
                      {meta.label}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {scenes.map((scene, index) => {
          const meta = SCENE_TYPE_META[scene.type];
          const isSelected = index === selectedIndex;
          const fps = useEditorStore.getState().config.fps ?? 30;
          const durationSec = (scene.duration / fps).toFixed(1);

          return (
            <div
              key={index}
              onClick={() => selectScene(index)}
              className={`group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors ${
                isSelected
                  ? "bg-primary/15 border border-primary/30"
                  : "hover:bg-surface-2 border border-transparent"
              }`}
            >
              <GripVertical className="h-3.5 w-3.5 text-text-muted opacity-0 group-hover:opacity-50 shrink-0" />

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <meta.icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {scene.type === "title"
                      ? (scene as any).title || meta.label
                      : meta.label}
                  </p>
                  <p className="text-[10px] text-text-muted">{durationSec}s</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index > 0) moveScene(index, index - 1);
                  }}
                  className="rounded p-0.5 hover:bg-surface-3"
                  title="Move up"
                >
                  <ChevronUp className="h-3 w-3 text-text-muted" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (index < scenes.length - 1) moveScene(index, index + 1);
                  }}
                  className="rounded p-0.5 hover:bg-surface-3"
                  title="Move down"
                >
                  <ChevronDown className="h-3 w-3 text-text-muted" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateScene(index);
                  }}
                  className="rounded p-0.5 hover:bg-surface-3"
                  title="Duplicate"
                >
                  <Copy className="h-3 w-3 text-text-muted" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeScene(index);
                  }}
                  className="rounded p-0.5 hover:bg-danger/20"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3 text-danger" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
