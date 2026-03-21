"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Loader2, CheckCircle, AlertCircle } from "lucide-react";

type ScanState = "idle" | "scanning" | "success" | "error";

export function ScanButton({ domainId, hasPrompts }: { domainId: string; hasPrompts: boolean }) {
  const [state, setState] = useState<ScanState>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleScan() {
    setState("scanning");
    setError(null);

    try {
      const res = await fetch(`/api/scan/${domainId}`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Scan failed");
      }

      setState("success");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={handleScan}
        disabled={state === "scanning" || !hasPrompts}
        size="default"
        variant="outline"
      >
        {state === "scanning" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Scanning...
          </>
        ) : state === "success" ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Done
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Manual Scan
          </>
        )}
      </Button>

      {state === "error" && (
        <span className="flex items-center gap-1 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </span>
      )}
    </div>
  );
}
