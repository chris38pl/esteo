"use client";

import { useTranslations } from "next-intl";
import { PencilLine } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { openMobileSheetDialogDeferred } from "@/features/estimates/hooks/use-mobile-outside-dismiss-guard";
import {
  estimateHeaderMoreMenuPinActionClass,
} from "@/features/estimates/lib/estimate-header-layout";
import { cn } from "@/lib/utils";

export function EstimateHeaderRenameMenuItem({
  onOpenRenameDialog,
}: {
  onOpenRenameDialog: () => void;
}) {
  const t = useTranslations("estimates");

  return (
    <DropdownMenuItem
      className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
      onSelect={() => openMobileSheetDialogDeferred(onOpenRenameDialog)}
    >
      <PencilLine className="size-4" />
      {t("header.actions.rename")}
    </DropdownMenuItem>
  );
}
