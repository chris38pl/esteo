"use client";

import type { EstimateVersionStatus } from "@prisma/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";

const STATUS_OPTIONS: EstimateVersionStatus[] = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
];

interface AdminEstimatesStatusFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: EstimateVersionStatus | null;
  onApply: (status: EstimateVersionStatus | null) => void;
}

export function AdminEstimatesStatusFilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
}: AdminEstimatesStatusFilterSheetProps) {
  const tEstimates = useTranslations("estimates");
  const tFilter = useTranslations("estimates.list.filter");
  const tAdmin = useTranslations("admin.estimates");
  const [draftStatus, setDraftStatus] = useState<EstimateVersionStatus | "ALL">(
    value ?? "ALL",
  );

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftStatus(value ?? "ALL");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{tEstimates("list.toolbar.filters")}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 px-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{tFilter("fields.status")}</p>
            <Select
              value={draftStatus}
              onValueChange={(next) => setDraftStatus(next as EstimateVersionStatus | "ALL")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={tFilter("valuePlaceholder.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{tAdmin("filter.allStatuses")}</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {tEstimates(`status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className={estimateOutlineButtonClassName}
            onClick={() => {
              onApply(null);
              onOpenChange(false);
            }}
          >
            {tFilter("clear")}
          </Button>
          <Button
            type="button"
            className={estimatePrimaryButtonClassName}
            onClick={() => {
              onApply(draftStatus === "ALL" ? null : draftStatus);
              onOpenChange(false);
            }}
          >
            {tEstimates("list.dateRange.apply")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
