"use client";

import { Bug, Tag, Type } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { IssueAdvancedFields } from "@/features/issues/components/issue-advanced-fields";
import { IssueDescriptionField } from "@/features/issues/components/issue-description-field";
import { IssueFormSelect, IssueFormTextInput } from "@/features/issues/components/issue-form-fields";
import { IssueScreenshotUploader } from "@/features/issues/components/issue-screenshot-uploader";
import { collectIssueMetadata } from "@/features/issues/lib/collect-issue-metadata";
import { slugifyIssueTitle } from "@/features/issues/lib/slugify-issue-title";
import { createIssueSchema } from "@/features/issues/schemas/issue";
import { useIssueScreenshotUpload } from "@/features/issues/hooks/use-issue-screenshot-upload";
import { createIssueAction } from "@/features/issues/server/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Locale } from "@/lib/locale";

type IssueType = "BUG" | "UX" | "FEATURE" | "AI_EXTRACTION" | "PERFORMANCE";
type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type CreatedIssueSummary = {
  number: number;
  title: string;
  type: IssueType;
  priority: IssuePriority;
  folderSlug: string;
};

export function ReportIssueDialog({
  open,
  onOpenChange,
  locale,
  workspaceSlug,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  workspaceSlug: string | null;
  onSuccess?: (issue: CreatedIssueSummary) => void;
}) {
  const t = useTranslations("issues");
  const [pending, startTransition] = useTransition();
  const { uploadScreenshots, uploading } = useIssueScreenshotUpload();

  const [type, setType] = useState<IssueType>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");
  const [reproductionSteps, setReproductionSteps] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isBusy = pending || uploading;

  function resetForm() {
    setType("BUG");
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setReproductionSteps("");
    setExpectedBehavior("");
    setActualBehavior("");
    setScreenshots([]);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const metadata = collectIssueMetadata({ locale, workspaceSlug });

    const parsed = createIssueSchema.safeParse({
      type,
      title,
      description,
      priority,
      reproductionSteps,
      expectedBehavior,
      actualBehavior,
      ...metadata,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t("form.validationError"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await createIssueAction(parsed.data, locale);

        if (!result.success) {
          setError(result.error);
          return;
        }

        const createdIssue: CreatedIssueSummary = {
          number: result.data.number,
          title: parsed.data.title,
          type: parsed.data.type,
          priority: parsed.data.priority,
          folderSlug: slugifyIssueTitle(parsed.data.title),
        };

        if (screenshots.length > 0) {
          const uploadResult = await uploadScreenshots(result.data.issueId, screenshots);

          if (!uploadResult.success) {
            toast.warning(t("form.partialSuccess", { number: createdIssue.number }));
            resetForm();
            onOpenChange(false);
            try {
              onSuccess?.(createdIssue);
            } catch {
              // Ignore refresh errors from parent callback.
            }
            return;
          }
        }

        toast.success(t("form.success", { number: createdIssue.number }));
        resetForm();
        onOpenChange(false);
        try {
          onSuccess?.(createdIssue);
        } catch {
          // Ignore refresh errors from parent callback.
        }
      } catch {
        setError(t("form.unexpectedError"));
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isBusy) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        showCloseButton
        className="flex max-h-[min(90vh,880px)] w-[calc(100%-2rem)] max-w-[min(92vw,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(92vw,56rem)] max-sm:fixed max-sm:inset-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0"
      >
        <DialogHeader className="shrink-0 border-b px-4 py-4 text-left sm:px-6 sm:py-5">
          <div className="flex items-start gap-3 pr-8">
            <div
              className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
              aria-hidden
            >
              <Bug className="size-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 space-y-2">
              <DialogTitle className="text-xl font-bold tracking-normal text-foreground">
                {t("form.panelTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs leading-5 text-muted-foreground">
                {t("form.panelDescription")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-y-contain px-4 py-5 [-webkit-overflow-scrolling:touch] sm:px-6">
            <IssueFormSelect
              id="issue-type"
              label={t("form.type")}
              value={type}
              onValueChange={setType}
              icon={<Tag className="size-4" />}
              required
              disabled={isBusy}
              options={[
                { value: "BUG", label: t("type.BUG") },
                { value: "UX", label: t("type.UX") },
                { value: "FEATURE", label: t("type.FEATURE") },
                { value: "AI_EXTRACTION", label: t("type.AI_EXTRACTION") },
                { value: "PERFORMANCE", label: t("type.PERFORMANCE") },
              ]}
            />

            <IssueFormTextInput
              id="issue-title"
              label={t("form.issueTitle")}
              value={title}
              onChange={setTitle}
              placeholder={t("form.issueTitlePlaceholder")}
              icon={<Type className="size-4" />}
              required
              disabled={isBusy}
            />

            <IssueDescriptionField
              locale={locale}
              value={description}
              onChange={setDescription}
              disabled={isBusy}
            />

            <IssueScreenshotUploader files={screenshots} onChange={setScreenshots} disabled={isBusy} />

            <IssueAdvancedFields
              priority={priority}
              reproductionSteps={reproductionSteps}
              expectedBehavior={expectedBehavior}
              actualBehavior={actualBehavior}
              onPriorityChange={setPriority}
              onReproductionStepsChange={setReproductionSteps}
              onExpectedBehaviorChange={setExpectedBehavior}
              onActualBehaviorChange={setActualBehavior}
              disabled={isBusy}
            />

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-3 border-t bg-muted/20 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 sm:py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? t("form.submitting") : t("form.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
