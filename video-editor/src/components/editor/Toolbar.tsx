"use client";

import { useEditorStore } from "@/store/editor-store";
import { RenderDialog } from "./RenderDialog";
import {
  Film,
  Save,
  Upload,
  RotateCcw,
  Play,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

export function Toolbar() {
  const config = useEditorStore((s) => s.config);
  const setConfig = useEditorStore((s) => s.setConfig);
  const updateGlobal = useEditorStore((s) => s.updateGlobal);
  const resetConfig = useEditorStore((s) => s.resetConfig);
  const isRendering = useEditorStore((s) => s.isRendering);
  const setRendering = useEditorStore((s) => s.setRendering);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRenderDialog, setShowRenderDialog] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleSave = useCallback(() => {
    const json = JSON.stringify(config, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.id || "video"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [config]);

  const handleLoad = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const loaded = JSON.parse(reader.result as string);
          setConfig(loaded);
        } catch {
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [setConfig]
  );

  const handleRender = useCallback(async () => {
    if (isRendering) return;
    setRendering(true);
    setDownloadUrl(null);
    setShowRenderDialog(true);

    const store = useEditorStore.getState();
    store.clearRenderLogs();

    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: store.config,
          outputName: store.config.id || "output",
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          const lines = text.split("\n").filter(Boolean);
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);
                if (parsed.progress !== undefined) {
                  useEditorStore.getState().setRenderProgress(parsed.progress);
                }
                if (parsed.log) {
                  useEditorStore.getState().addRenderLog(parsed.log);
                }
                if (parsed.done) {
                  useEditorStore.getState().addRenderLog("Render complete!");
                }
                if (parsed.downloadUrl) {
                  setDownloadUrl(parsed.downloadUrl);
                }
                if (parsed.error) {
                  useEditorStore.getState().addRenderLog(`Error: ${parsed.error}`);
                }
              } catch {
                useEditorStore.getState().addRenderLog(data);
              }
            }
          }
        }
      }
    } catch (err) {
      useEditorStore
        .getState()
        .addRenderLog(`Render failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      setRendering(false);
    }
  }, [isRendering, setRendering]);

  return (
    <>
      <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-3">
          <Film className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Citeplex Video Creator</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Format toggle */}
          <div className="flex rounded-md border border-border overflow-hidden text-xs">
            <button
              onClick={() => updateGlobal({ format: "youtube" })}
              className={`px-3 py-1.5 transition-colors ${
                config.format === "youtube"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-text-muted hover:bg-surface-3"
              }`}
            >
              YouTube 16:9
            </button>
            <button
              onClick={() => updateGlobal({ format: "shorts" })}
              className={`px-3 py-1.5 transition-colors ${
                config.format === "shorts"
                  ? "bg-primary text-white"
                  : "bg-surface-2 text-text-muted hover:bg-surface-3"
              }`}
            >
              Shorts 9:16
            </button>
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 transition-colors"
            title="Load project"
          >
            <Upload className="h-3.5 w-3.5" />
            Load
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleLoad}
            className="hidden"
          />

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 transition-colors"
            title="Save project"
          >
            <Save className="h-3.5 w-3.5" />
            Save
          </button>

          <button
            onClick={resetConfig}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-text-muted hover:bg-surface-2 transition-colors"
            title="Reset to default"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={handleRender}
            disabled={isRendering}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isRendering ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Rendering...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Render
              </>
            )}
          </button>
        </div>
      </header>

      <RenderDialog
        open={showRenderDialog}
        onClose={() => setShowRenderDialog(false)}
        downloadUrl={downloadUrl}
      />
    </>
  );
}
