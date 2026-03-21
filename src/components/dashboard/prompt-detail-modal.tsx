"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle } from "lucide-react";

interface ScanDetail {
  engine: string;
  response: string;
  brandMentioned: boolean;
  position: number | null;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
};

export function PromptDetailModal({
  open,
  onOpenChange,
  promptText,
  details,
  brandName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptText: string;
  details: ScanDetail[];
  brandName: string;
}) {
  function highlightBrand(text: string) {
    if (!brandName) return text;
    const regex = new RegExp(`(${brandName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, "**$1**");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-medium leading-snug pr-8">
            {promptText}
          </DialogTitle>
        </DialogHeader>

        {details.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No scan data for this prompt.</p>
        ) : (
          <Tabs defaultValue={details[0]?.engine} className="mt-2">
            <TabsList className="w-full justify-start">
              {details.map((d) => (
                <TabsTrigger key={d.engine} value={d.engine} className="gap-1.5">
                  {d.brandMentioned ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-red-400" />
                  )}
                  {ENGINE_LABELS[d.engine] ?? d.engine}
                </TabsTrigger>
              ))}
            </TabsList>

            {details.map((d) => (
              <TabsContent key={d.engine} value={d.engine} className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={d.brandMentioned ? "default" : "destructive"}>
                    {d.brandMentioned ? "Mentioned" : "Not Mentioned"}
                  </Badge>
                  {d.position !== null && (
                    <Badge variant="secondary">
                      Position #{d.position}
                    </Badge>
                  )}
                </div>

                <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {highlightBrand(d.response).split("**").map((part, i) =>
                    i % 2 === 1 ? (
                      <mark key={i} className="bg-primary/20 text-primary font-semibold px-0.5 rounded">
                        {part}
                      </mark>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
