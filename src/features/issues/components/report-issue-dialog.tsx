"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  IssueAdvancedFields,
} from "@/features/issues/components/issue-advanced-fields";
import { IssueDescriptionField } from "@/features/issues/components/issue-description-field";
import { IssueScreenshotUploader } from "@/features/issues/components/issue-screenshot-uploader";
import { collectIssueMetadata } from "@/features/issues/lib/collect-issue-metadata";
import { createIssueSchema } from "@/features/issues/schemas/issue";
import { useIssueScreenshotUpload } from "@/features/issues/hooks/use-issue-screenshot-upload";
import { createIssueAction } from "@/features/issues/server/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Locale } from "@/lib/locale";

type IssueType = "BUG" | "UX" | "FEATURE" | "AI_EXTRACTION" | "PERFORMANCE";
type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function ReportIssueDialog({
  open,
  onOpenChange,
  locale,
  workspaceSlug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  workspaceSlug: string | null;
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
      const result = await createIssueAction(parsed.data, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (screenshots.length > 0) {
        const uploadResult = await uploadScreenshots(result.data.issueId, screenshots);

        if (!uploadResult.success) {
          setError(uploadResult.error ?? t("form.uploadError"));
          return;
        }
      }

      toast.success(t("form.success", { number: result.data.number }));
      resetForm();
      onOpenChange(false);
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
      <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("form.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("form.type")}</Label>
            <Select value={type} onValueChange={(value) => setType(value as IssueType)} disabled={isBusy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUG">{t("type.BUG")}</SelectItem>
                <SelectItem value="UX">{t("type.UX")}</SelectItem>
                <SelectItem value="FEATURE">{t("type.FEATURE")}</SelectItem>
                <SelectItem value="AI_EXTRACTION">{t("type.AI_EXTRACTION")}</SelectItem>
                <SelectItem value="PERFORMANCE">{t("type.PERFORMANCE")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-title">{t("form.issueTitle")}</Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("form.issueTitlePlaceholder")}
              disabled={isBusy}
            />
          </div>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
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
