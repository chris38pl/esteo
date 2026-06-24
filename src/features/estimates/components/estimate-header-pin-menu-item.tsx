"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Pin, PinOff } from "lucide-react";
import { useTransition } from "react";

import { appToast } from "@/components/ui/app-toast";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { togglePinEstimateAction } from "@/features/estimates/server/pinned-actions";
import type { Locale } from "@/lib/locale";
import { estimateHeaderMoreMenuPinActionClass } from "@/features/estimates/lib/estimate-header-layout";
import { cn } from "@/lib/utils";

export function EstimateHeaderPinMenuItem({
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  isPinned,
}: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  isPinned: boolean;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
      disabled={pending}
      onSelect={() => {
        startTransition(async () => {
          const result = await togglePinEstimateAction({
            estimateId,
            workspaceId,
            workspaceSlug,
            locale,
            pin: !isPinned,
          });
          if (result.success) {
            appToast.success(
              t(isPinned ? "header.actions.unpinSuccess" : "header.actions.pinSuccess"),
            );
            router.refresh();
          } else if (result.error) {
            appToast.error(result.error);
          }
        });
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isPinned ? (
        <>
          <PinOff className="size-4" />
          {t("header.actions.unpinFromMenu")}
        </>
      ) : (
        <>
          <Pin className="size-4" />
          {t("header.actions.pinToMenu")}
        </>
      )}
    </DropdownMenuItem>
  );
}
