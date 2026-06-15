"use client";

import {
  AlertCircle,
  ChevronDown,
  CircleCheck,
  Flag,
  ListOrdered,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import {
  IssueFormSelect,
  IssueFormTextarea,
  issueFormLabelClassName,
} from "@/features/issues/components/issue-form-fields";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export function IssueAdvancedFields({
  priority,
  reproductionSteps,
  expectedBehavior,
  actualBehavior,
  onPriorityChange,
  onReproductionStepsChange,
  onExpectedBehaviorChange,
  onActualBehaviorChange,
  disabled,
}: {
  priority: IssuePriority;
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  onPriorityChange: (value: IssuePriority) => void;
  onReproductionStepsChange: (value: string) => void;
  onExpectedBehaviorChange: (value: string) => void;
  onActualBehaviorChange: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("issues");
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4 border-t border-border/60 pt-5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-9 w-full justify-between rounded-xl px-3 text-muted-foreground hover:bg-accent/50",
          open && "bg-accent/30 text-foreground",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={issueFormLabelClassName}>{t("form.moreDetails")}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </Button>

      {open ? (
        <div className="space-y-5">
          <IssueFormSelect
            id="issue-priority"
            label={t("form.priority")}
            value={priority}
            onValueChange={onPriorityChange}
            icon={<Flag className="size-4" />}
            disabled={disabled}
            options={[
              { value: "LOW", label: t("priority.LOW") },
              { value: "MEDIUM", label: t("priority.MEDIUM") },
              { value: "HIGH", label: t("priority.HIGH") },
              { value: "CRITICAL", label: t("priority.CRITICAL") },
            ]}
          />

          <IssueFormTextarea
            id="issue-repro"
            label={t("form.reproductionSteps")}
            value={reproductionSteps}
            onChange={onReproductionStepsChange}
            placeholder={t("form.reproductionStepsPlaceholder")}
            icon={<ListOrdered className="size-4" />}
            disabled={disabled}
            rows={3}
          />

          <IssueFormTextarea
            id="issue-expected"
            label={t("form.expectedBehavior")}
            value={expectedBehavior}
            onChange={onExpectedBehaviorChange}
            placeholder={t("form.expectedBehaviorPlaceholder")}
            icon={<CircleCheck className="size-4" />}
            disabled={disabled}
            rows={2}
          />

          <IssueFormTextarea
            id="issue-actual"
            label={t("form.actualBehavior")}
            value={actualBehavior}
            onChange={onActualBehaviorChange}
            placeholder={t("form.actualBehaviorPlaceholder")}
            icon={<AlertCircle className="size-4" />}
            disabled={disabled}
            rows={2}
          />
        </div>
      ) : null}
    </div>
  );
}
