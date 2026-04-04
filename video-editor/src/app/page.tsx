"use client";

import dynamic from "next/dynamic";
import { SceneList } from "@/components/editor/SceneList";
import { PropertyPanel } from "@/components/editor/PropertyPanel";
import { Timeline } from "@/components/editor/Timeline";
import { Toolbar } from "@/components/editor/Toolbar";

const PreviewPanel = dynamic(
  () =>
    import("@/components/editor/PreviewPanel").then((m) => m.PreviewPanel),
  { ssr: false, loading: () => <div className="text-text-muted text-sm">Loading preview...</div> }
);

export default function EditorPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Scene List */}
        <aside className="w-60 shrink-0 border-r border-border overflow-y-auto bg-surface">
          <SceneList />
        </aside>

        {/* Center: Preview */}
        <main className="flex-1 flex flex-col overflow-hidden bg-bg">
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <PreviewPanel />
          </div>
          <div className="shrink-0 border-t border-border">
            <Timeline />
          </div>
        </main>

        {/* Right: Properties */}
        <aside className="w-80 shrink-0 border-l border-border overflow-y-auto bg-surface">
          <PropertyPanel />
        </aside>
      </div>
    </div>
  );
}
