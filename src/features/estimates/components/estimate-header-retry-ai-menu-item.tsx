"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { retryEstimateGenerationAction } from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";
import { estimateHeaderMoreMenuPinActionClass } from "@/features/estimates/lib/estimate-header-layout";
import { cn } from "@/lib/utils";

export function EstimateHeaderRetryAiMenuItem({
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
}: {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <DropdownMenuItem
        className={cn("gap-2", estimateHeaderMoreMenuPinActionClass)}
        disabled={pending}
        onSelect={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await retryEstimateGenerationAction({
              estimateId,
              workspaceId,
              workspaceSlug,
              locale,
            });
            if (!result.success) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        <Sparkles className="size-4" />
        {pending ? t("editor.retryGenerationPending") : t("header.actions.generateAiDraft")}
      </DropdownMenuItem>
      {error ? (
        <p className="px-2 pb-2 text-destructive text-xs">{error}</p>
      ) : null}
    </>
  );
}
