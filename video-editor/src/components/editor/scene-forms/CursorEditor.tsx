"use client";

import type { CursorKeyframe } from "@video/components/AnimatedCursor";
import { Plus, Trash2 } from "lucide-react";

interface CursorEditorProps {
  keyframes: CursorKeyframe[];
  onChange: (keyframes: CursorKeyframe[]) => void;
}

export function CursorEditor({ keyframes, onChange }: CursorEditorProps) {
  const addKeyframe = () => {
    const lastFrame = keyframes.length > 0 ? keyframes[keyframes.length - 1].frame + 30 : 30;
    onChange([...keyframes, { frame: lastFrame, x: 960, y: 540 }]);
  };

  const updateKeyframe = (index: number, patch: Partial<CursorKeyframe>) => {
    const updated = keyframes.map((kf, i) =>
      i === index ? { ...kf, ...patch } : kf
    );
    onChange(updated);
  };

  const removeKeyframe = (index: number) => {
    onChange(keyframes.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
          Cursor Keyframes
        </label>
        <button
          onClick={addKeyframe}
          className="flex items-center gap-1 text-[10px] text-primary hover:text-primary-hover"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {keyframes.length === 0 ? (
        <p className="text-[10px] text-text-muted italic">No cursor keyframes</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {keyframes.map((kf, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1.5 text-[10px]"
            >
              <div className="flex items-center gap-1">
                <span className="text-text-muted w-3">F</span>
                <input
                  type="number"
                  value={kf.frame}
                  onChange={(e) =>
                    updateKeyframe(i, { frame: Number(e.target.value) })
                  }
                  className="input-field-sm w-14"
                  min={0}
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-text-muted">X</span>
                <input
                  type="number"
                  value={kf.x}
                  onChange={(e) =>
                    updateKeyframe(i, { x: Number(e.target.value) })
                  }
                  className="input-field-sm w-14"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-text-muted">Y</span>
                <input
                  type="number"
                  value={kf.y}
                  onChange={(e) =>
                    updateKeyframe(i, { y: Number(e.target.value) })
                  }
                  className="input-field-sm w-14"
                />
              </div>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kf.click ?? false}
                  onChange={(e) =>
                    updateKeyframe(i, { click: e.target.checked })
                  }
                  className="accent-primary h-3 w-3"
                />
                <span className="text-text-muted">Click</span>
              </label>
              <button
                onClick={() => removeKeyframe(i)}
                className="ml-auto rounded p-0.5 hover:bg-danger/20"
              >
                <Trash2 className="h-3 w-3 text-danger" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
