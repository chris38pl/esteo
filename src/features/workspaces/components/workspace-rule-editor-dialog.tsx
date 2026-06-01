"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { WORKSPACE_RULE_MAX_LENGTH } from "@/features/workspaces/lib/workspace-rules-limits";
import { cn } from "@/lib/utils";

const textareaClassName = cn(
  "min-h-[160px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function WorkspaceRuleEditorDialog({
  open,
  mode,
  initialContent,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialContent: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string) => void;
}) {
  const t = useTranslations("workspaces.settings.rules");
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const charCount = content.length;
  const overLimit = charCount > WORKSPACE_RULE_MAX_LENGTH;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim() || overLimit) {
      return;
    }
    onSubmit(content.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("dialog.createTitle") : t("dialog.editTitle")}</DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="workspace-rule-content">{t("dialog.contentLabel")}</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  overLimit ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {t("ruleCharCounter", { count: charCount, max: WORKSPACE_RULE_MAX_LENGTH })}
              </span>
            </div>
            <textarea
              id="workspace-rule-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={t("dialog.contentPlaceholder")}
              disabled={isPending}
              rows={6}
              maxLength={WORKSPACE_RULE_MAX_LENGTH}
              className={textareaClassName}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              type="submit"
              className="rounded-full bg-violet-600 text-white hover:bg-violet-700 dark:bg-primary dark:hover:bg-primary/90"
              disabled={isPending || !content.trim() || overLimit}
            >
              {isPending
                ? mode === "create"
                  ? t("creating")
                  : t("dialog.saving")
                : mode === "create"
                  ? t("createSubmit")
                  : t("dialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
