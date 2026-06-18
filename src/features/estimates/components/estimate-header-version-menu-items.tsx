"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useTransition } from "react";

import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  archiveEstimateVersionAction,
  deleteEstimateVersionAction,
  unarchiveEstimateVersionAction,
} from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";
import { estimateHeaderMoreMenuPinActionClass } from "@/features/estimates/lib/estimate-header-layout";
import { cn } from "@/lib/utils";

export function EstimateHeaderVersionMenuItems({
  estimateId,
  activeVersionId,
  isArchived,
  versionCount,
  workspaceId,
  workspaceSlug,
  locale,
}: {
  estimateId: string;
  activeVersionId: string;
  isArchived: boolean;
  versionCount: number;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const canDelete = versionCount > 1;

  return (
    <>
      {isArchived ? (
        <DropdownMenuItem
          className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
          disabled={pending}
          onSelect={() => {
            startTransition(async () => {
              const result = await unarchiveEstimateVersionAction({
                estimateId,
                versionId: activeVersionId,
                workspaceId,
                workspaceSlug,
                locale,
              });
              if (result.success) {
                router.refresh();
              }
            });
          }}
        >
          <ArchiveRestore className="size-4" />
          {t("header.actions.unarchiveVersion")}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
          disabled={pending}
          onSelect={() => {
            startTransition(async () => {
              const result = await archiveEstimateVersionAction({
                estimateId,
                versionId: activeVersionId,
                workspaceId,
                workspaceSlug,
                locale,
              });
              if (result.success) {
                router.refresh();
              }
            });
          }}
        >
          <Archive className="size-4" />
          {t("header.actions.archiveVersion")}
        </DropdownMenuItem>
      )}

      <DropdownMenuSeparator />

      <DropdownMenuItem
        variant="destructive"
        className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
        disabled={pending || !canDelete}
        onSelect={() => {
          if (!canDelete) {
            return;
          }
          startTransition(async () => {
            const result = await deleteEstimateVersionAction({
              estimateId,
              versionId: activeVersionId,
              workspaceId,
              workspaceSlug,
              locale,
            });
            if (result.success) {
              router.replace(
                `/${locale}/dashboard/${workspaceSlug}/estimates/${estimateId}?v=${result.data.redirectVersionNumber}`,
              );
            }
          });
        }}
      >
        <Trash2 className="size-4" />
        {t("header.actions.deleteVersion")}
      </DropdownMenuItem>
    </>
  );
}
