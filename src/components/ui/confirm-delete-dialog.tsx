"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConfirmDeleteDialogProps {
  title?: string;
  description?: string;
  confirmText?: string;
  trigger: React.ReactNode;
  onConfirm: () => Promise<void> | void;
}

export function ConfirmDeleteDialog({
  title = "Are you sure?",
  description = "This action cannot be undone. All associated data will be permanently deleted.",
  confirmText,
  trigger,
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const needsConfirmation = !!confirmText;
  const isConfirmed = !needsConfirmation || inputValue === confirmText;

  async function handleConfirm() {
    if (!isConfirmed) return;
    setLoading(true);
    try {
      await onConfirm();
    } catch {
      setLoading(false);
      setOpen(false);
    }
  }

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (!value) {
      setInputValue("");
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {needsConfirmation && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">{confirmText}</span> to confirm:
            </p>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={confirmText}
              autoFocus
              disabled={loading}
            />
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={loading || !isConfirmed}
            variant="destructive"
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
