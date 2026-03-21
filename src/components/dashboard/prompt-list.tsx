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
import { Plus, Trash2, MessageSquare, Loader2, ArrowUpRight } from "lucide-react";
import { createPrompt, deletePrompt, togglePrompt } from "@/app/actions/prompt";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import Link from "next/link";

interface Prompt {
  id: string;
  text: string;
  category: string | null;
  language: string | null;
  country: string | null;
  isActive: boolean;
  createdAt: Date;
}

export function PromptList({
  prompts,
  domainId,
  promptLimit,
  totalPromptsUsed,
}: {
  prompts: Prompt[];
  domainId: string;
  promptLimit: number;
  totalPromptsUsed: number;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, promptLimit - totalPromptsUsed);
  const isAtLimit = remaining <= 0;

  const handleCreate = async (formData: FormData) => {
    setAdding(true);
    setError(null);
    try {
      await createPrompt(domainId, formData);
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalPromptsUsed}</span> / {promptLimit} prompts used
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            remaining === 0
              ? "bg-destructive/10 text-destructive"
              : remaining <= 2
                ? "bg-amber-500/10 text-amber-600"
                : "bg-emerald-500/10 text-emerald-600"
          }`}>
            {remaining} remaining
          </span>
        </div>

        {isAtLimit ? (
          <Button asChild>
            <Link href="/pricing">
              Upgrade Plan
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); setError(null); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Prompt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a new prompt</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="text">Prompt / Keyword</Label>
                  <Input
                    id="text"
                    name="text"
                    placeholder='e.g. "Best project management tools for startups"'
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Language and category will be detected automatically.
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={adding}>
                  {adding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Detecting language & category...
                    </>
                  ) : (
                    "Add Prompt"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {prompts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No prompts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground text-center max-w-md">
              Add keywords or questions that potential customers might ask AI
              assistants about your industry.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {prompts.length} Prompt{prompts.length !== 1 && "s"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt) => (
                  <TableRow key={prompt.id}>
                    <TableCell className="font-medium max-w-md">
                      <div className="flex items-start gap-2">
                        {prompt.country && (
                          <span className="shrink-0 inline-flex items-center justify-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground leading-none mt-1">
                            {prompt.country}
                          </span>
                        )}
                        <div className="line-clamp-2">{prompt.text}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {prompt.category ? (
                        <Badge variant="outline">{prompt.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => togglePrompt(prompt.id, domainId)}>
                        <Badge variant={prompt.isActive ? "default" : "secondary"}>
                          {prompt.isActive ? "Active" : "Paused"}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      <ConfirmDeleteDialog
                        title="Delete Prompt"
                        description={`Are you sure you want to delete this prompt? All scan results for this prompt will be permanently deleted.`}
                        onConfirm={() => deletePrompt(prompt.id, domainId)}
                        trigger={
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
