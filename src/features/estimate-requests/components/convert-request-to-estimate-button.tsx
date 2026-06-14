"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { convertRequestToEstimateAction } from "@/features/estimate-requests/server/workspace-request-actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function ConvertRequestToEstimateButton({
  requestId,
  workspaceId,
  workspaceSlug,
  locale,
  variant = "primary",
  className,
  canCreateEstimate = true,
  estimateLimitReached = false,
  billingHref = null,
}: {
  requestId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  variant?: "primary" | "outline";
  className?: string;
  canCreateEstimate?: boolean;
  estimateLimitReached?: boolean;
  billingHref?: string | null;
}) {
  const t = useTranslations("requests");
  const tActions = useTranslations("requests.list.actions");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = !canCreateEstimate || isPending;

  function handleClick() {
    if (disabled) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await convertRequestToEstimateAction({
        workspaceId,
        workspaceSlug,
        requestId,
        locale,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(
        `/${locale}/dashboard/${workspaceSlug}/estimates/${result.data.estimateId}`,
      );
      router.refresh();
    });
  }

  const buttonClassName =
    variant === "primary" ? estimatePrimaryButtonClassName : estimateOutlineButtonClassName;

  const button = (
    <Button
      type="button"
      size="sm"
      variant={variant === "primary" ? "default" : "outline"}
      className={buttonClassName}
      disabled={disabled}
      onClick={handleClick}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
      {t("detail.createEstimate")}
    </Button>
  );

  const wrappedButton =
    estimateLimitReached && !canCreateEstimate ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[14rem] space-y-1.5 p-3 text-left">
            <p>{tActions("limitTooltip")}</p>
            {billingHref ? (
              <Link
                href={billingHref}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {tActions("limitTooltipLink")}
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      button
    );

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      {wrappedButton}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
