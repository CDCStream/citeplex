"use client";

import { useEditorStore } from "@/store/editor-store";
import { TitleForm } from "./scene-forms/TitleForm";
import { ScreenForm } from "./scene-forms/ScreenForm";
import { AvatarForm } from "./scene-forms/AvatarForm";
import { SplitForm } from "./scene-forms/SplitForm";
import { GlobalSettings } from "./GlobalSettings";
import { Settings } from "lucide-react";
import { useState } from "react";

export function PropertyPanel() {
  const selectedIndex = useEditorStore((s) => s.selectedSceneIndex);
  const scene = useEditorStore(
    (s) => s.config.scenes[s.selectedSceneIndex]
  );
  const updateScene = useEditorStore((s) => s.updateScene);
  const [showGlobal, setShowGlobal] = useState(false);

  const handleUpdate = (patch: Record<string, unknown>) => {
    updateScene(selectedIndex, patch as any);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          {showGlobal ? "Global Settings" : "Properties"}
        </span>
        <button
          onClick={() => setShowGlobal(!showGlobal)}
          className={`rounded-md p-1.5 transition-colors ${
            showGlobal
              ? "bg-primary/15 text-primary"
              : "text-text-muted hover:bg-surface-2"
          }`}
          title="Global settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {showGlobal ? (
          <GlobalSettings />
        ) : !scene ? (
          <p className="text-xs text-text-muted text-center mt-8">
            No scene selected
          </p>
        ) : (
          <>
            {/* Common: duration */}
            <FieldGroup label="Duration">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={scene.duration}
                  onChange={(e) =>
                    handleUpdate({ duration: Math.max(1, Number(e.target.value)) })
                  }
                  min={1}
                  className="input-field w-24"
                />
                <span className="text-[10px] text-text-muted">
                  frames ({((scene.duration) / (useEditorStore.getState().config.fps ?? 30)).toFixed(1)}s)
                </span>
              </div>
            </FieldGroup>

            {/* Scene type-specific form */}
            {scene.type === "title" && (
              <TitleForm scene={scene} onUpdate={handleUpdate} />
            )}
            {scene.type === "screen" && (
              <ScreenForm scene={scene} onUpdate={handleUpdate} />
            )}
            {scene.type === "avatar" && (
              <AvatarForm scene={scene} onUpdate={handleUpdate} />
            )}
            {scene.type === "split" && (
              <SplitForm scene={scene} onUpdate={handleUpdate} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function FieldGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-text-muted mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
