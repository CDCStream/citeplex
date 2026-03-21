"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Users, ChevronDown, ChevronRight, Check, X } from "lucide-react";
import { createCompetitor, deleteCompetitor } from "@/app/actions/competitor";
import { Favicon } from "@/components/ui/favicon";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EngineIcon } from "@/components/ui/engine-icon";
import { countryFlag } from "@/lib/constants/countries";
import type { CompetitorStats } from "@/lib/scan/get-competitor-stats";

interface Competitor {
  id: string;
  url: string;
  brandName: string;
  createdAt: Date;
}

const ENGINE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  gemini: "Gemini",
  claude: "Claude",
  deepseek: "DeepSeek",
  grok: "Grok",
  mistral: "Mistral",
};

const ALL_ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "deepseek", "grok", "mistral"];

export function CompetitorList({
  competitors,
  domainId,
  competitorStats = [],
}: {
  competitors: Competitor[];
  domainId: string;
  competitorStats?: CompetitorStats[];
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getStats = (compId: string) => competitorStats.find((s) => s.competitorId === compId);

  const handleCreate = async (formData: FormData) => {
    await createCompetitor(domainId, formData);
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a competitor</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input id="brandName" name="brandName" placeholder="e.g. Competitor Inc" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input id="url" name="url" placeholder="https://competitor.com" required />
              </div>
              <Button type="submit" className="w-full">Add Competitor</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {competitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No competitors yet</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Add competitor brands to compare their AI search visibility against yours.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {competitors.map((comp) => {
            const stats = getStats(comp.id);
            const isExpanded = expanded[comp.id] ?? false;
            const hasResults = stats && stats.promptResults.length > 0;

            return (
              <Card key={comp.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => hasResults && toggleExpand(comp.id)}
                    >
                      {hasResults && (
                        isExpanded
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <Favicon url={comp.url} size={24} />
                      <div>
                        <CardTitle className="text-base">{comp.brandName}</CardTitle>
                        <p className="text-xs text-muted-foreground">{comp.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {stats && (
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Mention</div>
                            <Badge
                              variant={stats.overallMentionRate >= 50 ? "default" : "secondary"}
                              className={stats.overallMentionRate >= 80 ? "bg-green-500" : stats.overallMentionRate >= 50 ? "bg-yellow-500" : ""}
                            >
                              {stats.overallMentionRate}%
                            </Badge>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Position</div>
                            <span className="font-semibold">
                              {stats.overallAvgPosition !== null ? `#${stats.overallAvgPosition}` : "—"}
                            </span>
                          </div>
                        </div>
                      )}
                      <ConfirmDeleteDialog
                        title="Delete Competitor"
                        description={`Are you sure you want to delete "${comp.brandName}"? All scan results for this competitor will be permanently deleted.`}
                        onConfirm={() => deleteCompetitor(comp.id, domainId)}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                      />
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && hasResults && (
                  <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {stats.promptResults.some((r) => r.country) && (
                              <TableHead className="text-center w-[40px]"></TableHead>
                            )}
                            <TableHead className="min-w-[200px]">Prompt</TableHead>
                            <TableHead className="text-center w-[70px]">Mention</TableHead>
                            <TableHead className="text-center w-[70px]">Position</TableHead>
                            {ALL_ENGINES.map((eng) => (
                              <TableHead key={eng} className="text-center w-[90px]">
                                <div className="flex items-center justify-center gap-1">
                                  <EngineIcon engine={eng} size={16} />
                                  <span className="text-xs">{ENGINE_LABELS[eng]}</span>
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.promptResults.map((row) => (
                            <TableRow key={row.promptId}>
                              {stats.promptResults.some((r) => r.country) && (
                                <TableCell className="text-center">
                                  {row.country ? (
                                    <span className="text-sm" title={row.country}>
                                      {countryFlag(row.country)}
                                    </span>
                                  ) : ""}
                                </TableCell>
                              )}
                              <TableCell className="text-sm max-w-[250px]" title={row.promptText}>
                                <div className="truncate">{row.promptText}</div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge
                                  variant={row.mentionRate >= 50 ? "default" : "secondary"}
                                  className={`text-xs ${row.mentionRate >= 80 ? "bg-green-500" : row.mentionRate >= 50 ? "bg-yellow-500" : ""}`}
                                >
                                  {row.mentionRate}%
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm font-medium">
                                {row.avgPosition !== null ? `#${row.avgPosition}` : "—"}
                              </TableCell>
                              {ALL_ENGINES.map((eng) => {
                                const result = row.engines.find((e) => e.engine === eng);
                                if (!result) {
                                  return <TableCell key={eng} className="text-center text-muted-foreground text-xs">—</TableCell>;
                                }
                                return (
                                  <TableCell key={eng} className="text-center">
                                    <div className="flex flex-col items-center gap-0.5">
                                      {result.mentioned ? (
                                        <Check className="h-3.5 w-3.5 text-green-500" />
                                      ) : (
                                        <X className="h-3.5 w-3.5 text-red-400" />
                                      )}
                                      <span className="text-[10px] text-muted-foreground">
                                        {result.position !== null ? `#${result.position}` : ""}
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
