"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { issueFormFieldClassName } from "@/features/issues/components/issue-form-fields";
import type { AdminIssueStatus } from "@/features/issues/schemas/issue";
import { bulkUpdateIssueStatusAction } from "@/features/issues/server/admin-actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function IssuesListBulkActions({
  selectedNumbers,
  locale,
  onClearSelection,
  onStatusUpdated,
}: {
  selectedNumbers: number[];
  locale: Locale;
  onClearSelection: () => void;
  onStatusUpdated: (numbers: number[], status: AdminIssueStatus) => void;
}) {
  const t = useTranslations("issues");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<AdminIssueStatus>("RESOLVED");

  if (selectedNumbers.length === 0) {
    return null;
  }

  function handleApply() {
    startTransition(async () => {
      const result = await bulkUpdateIssueStatusAction(
        { numbers: selectedNumbers, status },
        locale,
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onStatusUpdated(selectedNumbers, status);
      onClearSelection();
      toast.success(
        t("list.bulk.statusUpdated", { count: result.data.updatedCount }),
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex size-7 items-center justify-center rounded-md bg-foreground text-xs font-semibold text-background">
          {selectedNumbers.length}
        </span>
        <span className="text-sm font-medium text-foreground">
          {t("list.bulk.selected")}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as AdminIssueStatus)}
          disabled={pending}
        >
          <SelectTrigger className={cn(issueFormFieldClassName, "h-9 w-[10.5rem]")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">{t("status.OPEN")}</SelectItem>
            <SelectItem value="ON_HOLD">{t("status.ON_HOLD")}</SelectItem>
            <SelectItem value="RESOLVED">{t("status.RESOLVED")}</SelectItem>
          </SelectContent>
        </Select>

        <Button type="button" size="sm" onClick={handleApply} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("list.bulk.applyStatus")}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          disabled={pending}
        >
          {t("list.bulk.clearSelection")}
        </Button>
      </div>
    </div>
  );
}
