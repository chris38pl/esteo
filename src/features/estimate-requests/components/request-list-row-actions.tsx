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
import { useState, useTransition } from "react";
import { appToast } from "@/components/ui/app-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  convertRequestToEstimateAction,
  deleteLinkedEstimateFromRequestAction,
} from "@/features/estimate-requests/server/workspace-request-actions";
import type { GenerationConfigurationOptions } from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const sectionLabelClassName =
  "px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground";
const DEFAULT_OPTION = "__default";
const NONE_OPTION = "__none";

export function RequestListRowActions({
  requestId,
  estimateId,
  workspaceId,
  workspaceSlug,
  locale,
  canCreateEstimate,
  estimateLimitReached,
  billingHref,
  generationConfiguration,
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
  generationConfiguration: GenerationConfigurationOptions;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  const t = useTranslations("requests.list.actions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeletingEstimate, setIsDeletingEstimate] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_OPTION);
  const [selectedPriceList, setSelectedPriceList] = useState(DEFAULT_OPTION);

  const estimateHref = estimateId
    ? `/${locale}/dashboard/${workspaceSlug}/estimates/${estimateId}`
    : null;
  const requestHref = `/${locale}/dashboard/${workspaceSlug}/requests/${requestId}`;

  const showLimitWarning = estimateLimitReached && !estimateId;
  const showCreateEstimate = !estimateId;
  const showViewEstimate = Boolean(estimateHref);
  const showDeleteEstimate = Boolean(estimateId);
  const showEstimateSection = showCreateEstimate || showViewEstimate || showDeleteEstimate;

  function resolveSelectedId(value: string): string | null | undefined {
    if (value === DEFAULT_OPTION) {
      return undefined;
    }
    if (value === NONE_OPTION) {
      return null;
    }
    return value;
  }

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
        templateId: resolveSelectedId(selectedTemplate),
        priceListId: resolveSelectedId(selectedPriceList),
      });

      if (!result.success) {
        appToast.error(result.error);
        return;
      }

      setCreateDialogOpen(false);
      router.push(`/${locale}/dashboard/${workspaceSlug}/estimates/${result.data.estimateId}`);
      router.refresh();
    });
  }

  function handleDeleteEstimate() {
    if (!estimateId || isDeletingEstimate) {
      return;
    }

    const confirmed = window.confirm(t("deleteEstimateConfirm"));
    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      setIsDeletingEstimate(true);
      const result = await deleteLinkedEstimateFromRequestAction({
        workspaceId,
        workspaceSlug,
        requestId,
        estimateId,
        locale,
      });

      if (!result.success) {
        appToast.error(result.error);
        setIsDeletingEstimate(false);
        return;
      }

      appToast.success(t("deleteEstimateSuccess"));
      setIsDeletingEstimate(false);
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
                    setSelectedTemplate(DEFAULT_OPTION);
                    setSelectedPriceList(DEFAULT_OPTION);
                    setCreateDialogOpen(true);
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
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2"
                  disabled={isPending || isDeletingEstimate}
                  onSelect={(event) => {
                    event.preventDefault();
                    handleDeleteEstimate();
                  }}
                >
                  {isDeletingEstimate ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {isDeletingEstimate ? t("deleteEstimateDeleting") : t("deleteEstimate")}
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t("createDialog.title")}</DialogTitle>
            <DialogDescription>{t("createDialog.description")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("createDialog.templateLabel")}</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_OPTION}>
                    {generationConfiguration.defaultTemplateId
                      ? t("createDialog.defaultTemplate")
                      : t("createDialog.noTemplate")}
                  </SelectItem>
                  <SelectItem value={NONE_OPTION}>{t("createDialog.noTemplate")}</SelectItem>
                  {generationConfiguration.templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("createDialog.priceListLabel")}</Label>
              <Select value={selectedPriceList} onValueChange={setSelectedPriceList}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_OPTION}>
                    {generationConfiguration.defaultPriceListId
                      ? t("createDialog.defaultPriceList")
                      : t("createDialog.noPriceList")}
                  </SelectItem>
                  <SelectItem value={NONE_OPTION}>{t("createDialog.noPriceList")}</SelectItem>
                  {generationConfiguration.priceLists.map((priceList) => (
                    <SelectItem key={priceList.id} value={priceList.id}>
                      {priceList.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setCreateDialogOpen(false)}
            >
              {t("createDialog.cancel")}
            </Button>
            <Button type="button" disabled={isPending || !canCreateEstimate} onClick={handleCreateEstimate}>
              {isPending ? t("createDialog.creating") : t("createDialog.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
