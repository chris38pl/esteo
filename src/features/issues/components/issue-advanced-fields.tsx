"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="space-y-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-muted-foreground"
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown className={cn("mr-1 size-4 transition-transform", open && "rotate-180")} />
        {t("form.moreDetails")}
      </Button>

      {open ? (
        <div className="space-y-4 rounded-xl border border-border/60 p-4">
          <div className="space-y-2">
            <Label>{t("form.priority")}</Label>
            <Select
              value={priority}
              onValueChange={(value) => onPriorityChange(value as IssuePriority)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{t("priority.LOW")}</SelectItem>
                <SelectItem value="MEDIUM">{t("priority.MEDIUM")}</SelectItem>
                <SelectItem value="HIGH">{t("priority.HIGH")}</SelectItem>
                <SelectItem value="CRITICAL">{t("priority.CRITICAL")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-repro">{t("form.reproductionSteps")}</Label>
            <Textarea
              id="issue-repro"
              value={reproductionSteps}
              onChange={(event) => onReproductionStepsChange(event.target.value)}
              rows={3}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-expected">{t("form.expectedBehavior")}</Label>
            <Textarea
              id="issue-expected"
              value={expectedBehavior}
              onChange={(event) => onExpectedBehaviorChange(event.target.value)}
              rows={2}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-actual">{t("form.actualBehavior")}</Label>
            <Textarea
              id="issue-actual"
              value={actualBehavior}
              onChange={(event) => onActualBehaviorChange(event.target.value)}
              rows={2}
              disabled={disabled}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
