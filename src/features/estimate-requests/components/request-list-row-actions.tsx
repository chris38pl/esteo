"use client";

import {
  AlertTriangle,
  Eye,
  ExternalLink,
  FilePlus2,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { convertRequestToEstimateAction } from "@/features/estimate-requests/server/workspace-request-actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const sectionLabelClassName =
  "px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";

export function RequestListRowActions({
  requestId,
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  canCreateEstimate,
  estimateLimitReached,
  billingHref,
  align = "end",
  className,
}: {
  requestId: string;
  estimateId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  canCreateEstimate: boolean;
  estimateLimitReached: boolean;
  billingHref: string | null;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const t = useTranslations("requests.list.actions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const estimateHref = estimateId
    ? `/${locale}/dashboard/${workspaceSlug}/estimates/${estimateId}`
    : null;
  const requestHref = `/${locale}/dashboard/${workspaceSlug}/requests/${requestId}`;

  const showLimitWarning = estimateLimitReached && !estimateId;
  const showCreateEstimate = !estimateId;
  const showViewEstimate = Boolean(estimateHref);
  const showDeleteEstimate = Boolean(estimateId);
  const showEstimateSection = showCreateEstimate || showViewEstimate || showDeleteEstimate;

  function handleCreateEstimate() {
    if (!canCreateEstimate || estimateId || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await convertRequestToEstimateAction({
        workspaceId,
        workspaceSlug,
        requestId,
        locale,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      router.push(`/${locale}/dashboard/${workspaceSlug}/estimates/${result.data.estimateId}`);
      router.refresh();
    });
  }

  return (
    <div
      className={cn("flex items-center justify-end gap-0.5", className)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {showLimitWarning ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="inline-flex size-7 items-center justify-center text-amber-500 dark:text-amber-400"
                aria-label={t("limitTooltip")}
              >
                <AlertTriangle className="size-3.5" strokeWidth={2} aria-hidden />
              </span>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[14rem] space-y-1.5 p-3 text-left">
              <p>{t("limitTooltip")}</p>
              {billingHref ? (
                <Link
                  href={billingHref}
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  {t("limitTooltipLink")}
                  <ExternalLink className="size-3" aria-hidden />
                </Link>
              ) : null}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
            aria-label={t("more")}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-56">
          <DropdownMenuLabel className={sectionLabelClassName}>
            {t("groups.request")}
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={requestHref} className="gap-2">
              <Eye className="size-4" />
              {t("viewRequest")}
            </Link>
          </DropdownMenuItem>

          {showEstimateSection ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className={sectionLabelClassName}>
                {t("groups.estimate")}
              </DropdownMenuLabel>
              {showCreateEstimate ? (
                <DropdownMenuItem
                  disabled={!canCreateEstimate || isPending}
                  className="gap-2"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleCreateEstimate();
                  }}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <FilePlus2 className="size-4" />
                  )}
                  {t("createEstimate")}
                </DropdownMenuItem>
              ) : null}
              {showViewEstimate ? (
                <DropdownMenuItem asChild>
                  <Link href={estimateHref!} className="gap-2">
                    <Eye className="size-4" />
                    {t("viewEstimate")}
                  </Link>
                </DropdownMenuItem>
              ) : null}
              {showDeleteEstimate ? (
                <DropdownMenuItem disabled variant="destructive" className="gap-2 opacity-50">
                  <Trash2 className="size-4" />
                  {t("deleteEstimate")}
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
