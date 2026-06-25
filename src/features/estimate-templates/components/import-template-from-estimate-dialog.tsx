"use client";

import { useEffect, useMemo, useState } from "react";
import { AlignLeft, FileInput, FileText, Loader2, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import { importEstimateMatchesSearch } from "@/features/estimate-templates/lib/import-estimate-search";
import {
  ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  ESTIMATE_TEMPLATE_NAME_MAX_LENGTH,
} from "@/features/estimate-templates/lib/template-limits";
import type { EstimateImportListItem } from "@/features/estimate-templates/types/estimate-import";
import {
  importTemplateFromEstimateAction,
  listEstimatesForTemplateImportAction,
} from "@/features/workspace-configuration/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function displayEstimateTitle(estimate: EstimateImportListItem): string {
  return estimate.title.trim() || "—";
}

function displayRequestNumber(estimate: EstimateImportListItem): string {
  return estimate.requestNumber?.trim() || "—";
}

function ImportEstimatePickerCard({
  estimate,
  selected,
  disabled,
  disabledReason,
  onSelect,
}: {
  estimate: EstimateImportListItem;
  selected: boolean;
  disabled: boolean;
  disabledReason?: string;
  onSelect: () => void;
}) {
  const t = useTranslations("workspaces.configuration.templates.import");

  const card = (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-colors",
        disabled && "cursor-not-allowed opacity-50",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border/70 hover:border-primary/40",
      )}
    >
      <p className="font-medium text-foreground">{displayEstimateTitle(estimate)}</p>
      <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
        <div className="flex gap-2">
          <dt className="shrink-0">{t("columnNumber")}:</dt>
          <dd className="min-w-0 truncate">{displayRequestNumber(estimate)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0">{t("columnInvestment")}:</dt>
          <dd className="min-w-0 truncate">{estimate.investmentLabel ?? "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0">{t("columnClient")}:</dt>
          <dd className="min-w-0 truncate">{estimate.customerName ?? "—"}</dd>
        </div>
      </dl>
    </button>
  );

  if (disabled && disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="block">{card}</span>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    );
  }

  return card;
}

function ImportEstimatePickerSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg bg-foreground/10 dark:bg-muted"
        />
      ))}
    </div>
  );
}

export function ImportTemplateFromEstimateDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceSlug,
  locale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.configuration.templates.import");
  const tToast = useTranslations("workspaces.configuration.templates.toast");
  const router = useRouter();
  const isMobile = useEstimateMobileLayout();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstimateId, setSelectedEstimateId] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<EstimateImportListItem[]>([]);
  const [isLoadingEstimates, setIsLoadingEstimates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setSearchQuery("");
      setSelectedEstimateId(null);
      setEstimates([]);
      setNameTouched(false);
      return;
    }

    let cancelled = false;
    setIsLoadingEstimates(true);

    void listEstimatesForTemplateImportAction({ workspaceId }, locale).then((result) => {
      if (cancelled) return;
      setIsLoadingEstimates(false);
      if (!result.success) {
        appToast.error(result.error);
        return;
      }
      setEstimates(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [locale, open, workspaceId]);

  const filteredEstimates = useMemo(
    () => estimates.filter((estimate) => importEstimateMatchesSearch(estimate, searchQuery)),
    [estimates, searchQuery],
  );

  const selectedEstimate = estimates.find((estimate) => estimate.id === selectedEstimateId) ?? null;

  useEffect(() => {
    if (!selectedEstimate || nameTouched) {
      return;
    }
    if (selectedEstimate.title.trim()) {
      setName(selectedEstimate.title.trim());
    }
  }, [nameTouched, selectedEstimate]);

  const trimmedName = name.trim();
  const canSubmit =
    !isSubmitting &&
    trimmedName.length > 0 &&
    name.length <= ESTIMATE_TEMPLATE_NAME_MAX_LENGTH &&
    description.length <= ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH &&
    selectedEstimateId != null &&
    selectedEstimate?.hasStructure === true;

  function isEstimateSelectable(estimate: EstimateImportListItem): boolean {
    return Boolean(estimate.latestVersionId && estimate.hasStructure);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || !selectedEstimateId) {
      return;
    }

    setIsSubmitting(true);
    const result = await importTemplateFromEstimateAction(
      {
        workspaceId,
        workspaceSlug,
        estimateId: selectedEstimateId,
        name: trimmedName,
        description: description.trim(),
      },
      locale,
    );
    setIsSubmitting(false);

    if (!result.success) {
      if (result.code === "EMPTY_STRUCTURE") {
        appToast.error(t("emptyStructure"));
      } else {
        appToast.error(result.error);
      }
      return;
    }

    appToast.success(tToast("importSuccess"));
    onOpenChange(false);
    router.push(
      `/${locale}/dashboard/${workspaceSlug}/configuration/templates/${result.data.templateId}`,
    );
  }

  const formCard = (
    <div className="space-y-5 rounded-lg border border-border/70 bg-muted/20 p-4">
      <div className="space-y-2">
        <label htmlFor="import-template-name" className="text-sm font-medium">
          {t("templateName")}
        </label>
        <div className="relative">
          <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="import-template-name"
            value={name}
            disabled={isSubmitting}
            placeholder={t("templateNamePlaceholder")}
            maxLength={ESTIMATE_TEMPLATE_NAME_MAX_LENGTH}
            onChange={(event) => {
              setNameTouched(true);
              setName(event.target.value);
            }}
            className="h-11 rounded-md pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="import-template-description" className="text-sm font-medium">
          {t("templateDescription")}
        </label>
        <div className="relative">
          <AlignLeft className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
          <textarea
            id="import-template-description"
            value={description}
            disabled={isSubmitting}
            placeholder={t("templateDescriptionPlaceholder")}
            maxLength={ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH}
            rows={3}
            onChange={(event) => setDescription(event.target.value)}
            className={cn(
              "border-input bg-background ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:ring-ring flex min-h-24 w-full resize-y rounded-md border px-3 py-2.5 pl-10 text-sm",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("searchHeading")}</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            disabled={isSubmitting || isLoadingEstimates}
            placeholder={t("searchPlaceholder")}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-10 rounded-md pl-10"
          />
        </div>

        {isLoadingEstimates ? (
          isMobile ? (
            <ImportEstimatePickerSkeleton />
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70">
              <ImportEstimatePickerSkeleton rows={5} />
            </div>
          )
        ) : estimates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
            {t("noEstimates")}
          </p>
        ) : filteredEstimates.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/80 p-8 text-center text-sm text-muted-foreground">
            {t("noSearchResults")}
          </p>
        ) : isMobile ? (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredEstimates.map((estimate) => {
              const selectable = isEstimateSelectable(estimate);
              return (
                <ImportEstimatePickerCard
                  key={estimate.id}
                  estimate={estimate}
                  selected={selectedEstimateId === estimate.id}
                  disabled={!selectable || isSubmitting}
                  disabledReason={!selectable ? t("emptyStructure") : undefined}
                  onSelect={() => {
                    if (!selectable) return;
                    setSelectedEstimateId(estimate.id);
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="max-h-72 overflow-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columnNumber")}</TableHead>
                  <TableHead>{t("columnInvestment")}</TableHead>
                  <TableHead>{t("columnClient")}</TableHead>
                  <TableHead>{t("columnTitle")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map((estimate) => {
                  const selectable = isEstimateSelectable(estimate);
                  const selected = selectedEstimateId === estimate.id;

                  const row = (
                    <TableRow
                      key={estimate.id}
                      data-state={selected ? "selected" : undefined}
                      onClick={() => {
                        if (!selectable || isSubmitting) return;
                        setSelectedEstimateId(estimate.id);
                      }}
                      className={cn(
                        selectable && !isSubmitting && "cursor-pointer",
                        !selectable && "opacity-50",
                        selected && "bg-primary/5",
                      )}
                      aria-selected={selected}
                    >
                      <TableCell className="font-medium tabular-nums">
                        {displayRequestNumber(estimate)}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate">
                        {estimate.investmentLabel ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[10rem] truncate">
                        {estimate.customerName ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate">
                        {displayEstimateTitle(estimate)}
                      </TableCell>
                    </TableRow>
                  );

                  if (!selectable) {
                    return (
                      <Tooltip key={estimate.id}>
                        <TooltipTrigger asChild>{row}</TooltipTrigger>
                        <TooltipContent>{t("emptyStructure")}</TooltipContent>
                      </Tooltip>
                    );
                  }

                  return row;
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );

  const submitButton = (
    <Button type="submit" disabled={!canSubmit} className="gap-2">
      {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      {t("createTemplate")}
    </Button>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileInput className="size-5 text-primary" />
                {t("dialogTitle")}
              </SheetTitle>
              <SheetDescription>{t("dialogDescription")}</SheetDescription>
            </SheetHeader>
            <div className="px-5 py-4">{formCard}</div>
            <SheetFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
              {submitButton}
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileInput className="size-5 text-primary" />
                {t("dialogTitle")}
              </DialogTitle>
              <DialogDescription>{t("dialogDescription")}</DialogDescription>
            </DialogHeader>
            <div className="py-2">{formCard}</div>
            <DialogFooter>{submitButton}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
