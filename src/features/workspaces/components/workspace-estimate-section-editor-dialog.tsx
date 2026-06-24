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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WORKSPACE_SECTION_RULE_MAX_LENGTH,
  WORKSPACE_SECTION_TITLE_MAX_LENGTH,
} from "@/features/workspaces/lib/workspace-section-limits";
import { cn } from "@/lib/utils";

const textareaClassName = cn(
  "min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2.5 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm dark:bg-input/30",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
);

export function WorkspaceEstimateSectionEditorDialog({
  open,
  mode,
  initialTitle,
  initialRule,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initialTitle: string;
  initialRule: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, rule: string) => void;
}) {
  const t = useTranslations("workspaces.settings.rules.sections");
  const [title, setTitle] = useState(initialTitle);
  const [rule, setRule] = useState(initialRule);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setRule(initialRule);
    }
  }, [open, initialTitle, initialRule]);

  const titleOverLimit = title.length > WORKSPACE_SECTION_TITLE_MAX_LENGTH;
  const ruleOverLimit = rule.length > WORKSPACE_SECTION_RULE_MAX_LENGTH;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || titleOverLimit || ruleOverLimit) {
      return;
    }
    onSubmit(title.trim(), rule.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? t("dialog.createTitle") : t("dialog.editTitle")}
          </DialogTitle>
          <DialogDescription>{t("dialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="estimate-section-title">{t("dialog.titleLabel")}</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  titleOverLimit ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {t("titleCounter", {
                  count: title.length,
                  max: WORKSPACE_SECTION_TITLE_MAX_LENGTH,
                })}
              </span>
            </div>
            <Input
              id="estimate-section-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={WORKSPACE_SECTION_TITLE_MAX_LENGTH}
              disabled={isPending}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="estimate-section-rule">{t("dialog.ruleLabel")}</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  ruleOverLimit ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {t("ruleCounter", {
                  count: rule.length,
                  max: WORKSPACE_SECTION_RULE_MAX_LENGTH,
                })}
              </span>
            </div>
            <textarea
              id="estimate-section-rule"
              value={rule}
              onChange={(event) => setRule(event.target.value)}
              placeholder={t("dialog.rulePlaceholder")}
              maxLength={WORKSPACE_SECTION_RULE_MAX_LENGTH}
              disabled={isPending}
              rows={4}
              className={textareaClassName}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || !title.trim() || titleOverLimit || ruleOverLimit}
            >
              {mode === "create" ? t("dialog.add") : t("dialog.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
