"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PencilLine } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { EstimateRenameDialog } from "@/features/estimates/components/estimate-rename-dialog";
import {
  estimateHeaderMoreMenuPinActionClass,
} from "@/features/estimates/lib/estimate-header-layout";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function EstimateHeaderRenameMenuItem({
  title,
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
}: {
  title?: string | null;
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}) {
  const t = useTranslations("estimates");
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem
        className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
        onSelect={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <PencilLine className="size-4" />
        {t("header.actions.rename")}
      </DropdownMenuItem>

      <EstimateRenameDialog
        open={open}
        onOpenChange={setOpen}
        initialTitle={title}
        estimateId={estimateId}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
      />
    </>
  );
}
