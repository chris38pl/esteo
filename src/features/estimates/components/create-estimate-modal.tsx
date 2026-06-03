"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInternalEstimateAction } from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";

interface CreateEstimateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}

export function CreateEstimateModal({
  open,
  onOpenChange,
  workspaceId,
  workspaceSlug,
  locale,
}: CreateEstimateModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setError(null);

    startTransition(async () => {
      const result = await createInternalEstimateAction({
        title: title.trim() || undefined,
        projectDescription: description.trim(),
        workspaceId,
        locale,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      setTitle("");
      setDescription("");
      router.push(
        `/${locale}/dashboard/${workspaceSlug}/estimates/${result.data.estimateId}`,
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New estimate</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g. Apartment renovation — Warsaw"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Project description <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              disabled={isPending}
              placeholder="Describe the project scope, client requirements, location, etc."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              AI will use this description to generate the estimate draft.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !description.trim()}>
              {isPending ? "Creating…" : "Create estimate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
