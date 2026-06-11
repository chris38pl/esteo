"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Hash, ListFilter, Plus, Type, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import {
  EMPTY_REQUEST_LIST_FILTER,
  REQUEST_LIST_FILTER_FIELDS,
  REQUEST_LIST_STATUS_VALUES,
  countMatchingRequests,
  createRequestListFilterCondition,
  isStatusRequestListFilterField,
  isTextRequestListFilterField,
  operatorsForRequestListField,
  type RequestListDateRange,
  type RequestListFilterCondition,
  type RequestListFilterField,
  type RequestListFilterLogic,
  type RequestListFilterState,
} from "@/features/estimate-requests/lib/requests-list-filter";
import type { WorkspaceRequestListItem } from "@/features/estimate-requests/server/workspace-requests";
import { cn } from "@/lib/utils";

interface RequestsListFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: WorkspaceRequestListItem[];
  searchQuery: string;
  appliedDateRange: RequestListDateRange;
  appliedFilter: RequestListFilterState;
  onApply: (filter: RequestListFilterState) => void;
}

const selectClassName =
  "h-9 min-w-0 flex-1 rounded-md border border-border/60 bg-muted/20 px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const DESKTOP_FILTER_MAX_WIDTH = "32rem";

function FilterFieldIcon({ field }: { field: RequestListFilterField }) {
  if (isStatusRequestListFilterField(field)) {
    return (
      <span className="estimate-mobile-position-icon flex size-9 shrink-0 items-center justify-center rounded-lg">
        <ListFilter className="size-4 text-primary dark:text-muted-foreground" aria-hidden />
      </span>
    );
  }

  const Icon = isTextRequestListFilterField(field) ? Type : Hash;
  return (
    <span className="estimate-mobile-position-icon flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4 text-primary dark:text-muted-foreground" aria-hidden />
    </span>
  );
}

export function RequestsListFilterSheet({
  open,
  onOpenChange,
  requests,
  searchQuery,
  appliedDateRange,
  appliedFilter,
  onApply,
}: RequestsListFilterSheetProps) {
  const t = useTranslations("requests");
  const isMobile = useEstimateMobileLayout();
  const [draft, setDraft] = useState<RequestListFilterState>(appliedFilter);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(appliedFilter);
    } else {
      setFieldPickerOpen(false);
    }
  }, [open, appliedFilter]);

  const usedFields = new Set(draft.conditions.map((condition) => condition.field));
  const addableFields = REQUEST_LIST_FILTER_FIELDS.filter((field) => !usedFields.has(field));

  const previewCount = countMatchingRequests(requests, {
    searchQuery,
    filter: draft,
    dateRange: appliedDateRange,
  });

  const updateCondition = (id: string, patch: Partial<RequestListFilterCondition>) => {
    setDraft((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition,
      ),
    }));
  };

  const removeCondition = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((condition) => condition.id !== id),
    }));
  };

  const addCondition = (field: RequestListFilterField) => {
    setDraft((prev) => ({
      ...prev,
      conditions: [...prev.conditions, createRequestListFilterCondition(field)],
    }));
    setFieldPickerOpen(false);
  };

  const clearDraft = () => {
    setDraft(EMPTY_REQUEST_LIST_FILTER);
    onApply(EMPTY_REQUEST_LIST_FILTER);
    onOpenChange(false);
  };

  const applyDraft = () => {
    onApply(draft);
    onOpenChange(false);
  };

  const closeButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-muted-foreground"
      aria-label={t("list.filter.close")}
      onClick={() => onOpenChange(false)}
    >
      <X className="size-4" />
    </Button>
  );

  const titleClassName = "text-left text-base font-semibold leading-snug";

  const body = (
    <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t("list.filter.fieldsTitle")}</h3>
          {draft.conditions.length > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setDraft((prev) => ({ ...prev, conditions: [] }))}
            >
              {t("list.filter.clearAll")}
            </button>
          ) : null}
        </div>

        <div className="space-y-3">
          {draft.conditions.map((condition) => (
            <div
              key={condition.id}
              className="rounded-xl border border-border/60 bg-card/50 p-3"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <FilterFieldIcon field={condition.field} />
                <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                  {t(`list.filter.fields.${condition.field}`)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground"
                  aria-label={t("list.filter.removeCondition")}
                  onClick={() => removeCondition(condition.id)}
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={condition.operator}
                  onChange={(event) =>
                    updateCondition(condition.id, {
                      operator: event.target.value as RequestListFilterCondition["operator"],
                    })
                  }
                  className={selectClassName}
                  aria-label={t("list.filter.operatorAria")}
                >
                  {operatorsForRequestListField(condition.field).map((operator) => (
                    <option key={operator} value={operator}>
                      {t(`list.filter.operators.${operator}`)}
                    </option>
                  ))}
                </select>

                {isStatusRequestListFilterField(condition.field) ? (
                  <select
                    value={condition.value}
                    onChange={(event) =>
                      updateCondition(condition.id, { value: event.target.value })
                    }
                    className={selectClassName}
                    aria-label={t("list.filter.valueAria")}
                  >
                    <option value="">{t("list.filter.valuePlaceholder.status")}</option>
                    {REQUEST_LIST_STATUS_VALUES.map((status) => (
                      <option key={status} value={status}>
                        {t(`status.${status}`)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type={isTextRequestListFilterField(condition.field) ? "text" : "number"}
                    value={condition.value}
                    onChange={(event) =>
                      updateCondition(condition.id, { value: event.target.value })
                    }
                    placeholder={
                      isTextRequestListFilterField(condition.field)
                        ? t("list.filter.valuePlaceholder.text")
                        : t("list.filter.valuePlaceholder.number")
                    }
                    className="h-9 min-w-0 flex-1 border-border/60 bg-muted/20 text-sm shadow-none"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {addableFields.length > 0 ? (
          <div className="space-y-2">
            {fieldPickerOpen ? (
              <div
                className="overflow-hidden rounded-xl border border-primary/35 bg-card shadow-md"
                role="listbox"
                aria-label={t("list.filter.chooseField")}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground">
                    {t("list.filter.chooseField")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground"
                    aria-label={t("list.filter.closeFieldPicker")}
                    onClick={() => setFieldPickerOpen(false)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
                <div className="divide-y divide-border/50 p-1.5">
                  {addableFields.map((field) => (
                    <button
                      key={field}
                      type="button"
                      role="option"
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent active:bg-accent/80"
                      onClick={() => addCondition(field)}
                    >
                      <FilterFieldIcon field={field} />
                      <span>{t(`list.filter.fields.${field}`)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-3 text-sm font-medium transition-colors",
                fieldPickerOpen
                  ? "border-border/60 bg-muted/20 text-muted-foreground hover:text-foreground"
                  : "border-border/70 text-muted-foreground hover:border-border hover:text-foreground",
              )}
              aria-expanded={fieldPickerOpen}
              onClick={() => setFieldPickerOpen((prev) => !prev)}
            >
              {fieldPickerOpen ? (
                <>
                  <X className="size-4" />
                  {t("list.filter.cancelAdd")}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("list.filter.addFilter")}
                </>
              )}
            </button>
          </div>
        ) : null}
      </section>

      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold text-foreground">{t("list.filter.logicTitle")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["and", "or"] as RequestListFilterLogic[]).map((logic) => {
            const selected = draft.logic === logic;
            return (
              <button
                key={logic}
                type="button"
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                  selected
                    ? "border-primary/40 bg-primary/8 text-foreground"
                    : "border-border/60 bg-card/40 text-muted-foreground",
                )}
                onClick={() => setDraft((prev) => ({ ...prev, logic }))}
              >
                <span
                  className={cn(
                    "size-3.5 rounded-full border",
                    selected ? "border-primary bg-primary" : "border-border/80 bg-transparent",
                  )}
                  aria-hidden
                />
                {t(`list.filter.logic.${logic}`)}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        className={estimateOutlineButtonClassName}
        onClick={clearDraft}
      >
        {t("list.filter.clear")}
      </Button>
      <Button type="button" className={estimatePrimaryButtonClassName} onClick={applyDraft}>
        {t("list.filter.showResults", { count: previewCount })}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="z-[80] flex max-h-[92dvh] gap-0 rounded-t-2xl border-x-0 border-b-0 p-0"
          overlayClassName="z-[80]"
          showCloseButton={false}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border/80" aria-hidden />

          <SheetHeader className="border-b border-border/40 px-4 pb-3 pt-3">
            <div className="flex items-start justify-between gap-3">
              <SheetTitle className={titleClassName}>{t("list.filter.title")}</SheetTitle>
              {closeButton}
            </div>
          </SheetHeader>

          {body}

          <SheetFooter className="grid grid-cols-2 gap-2 border-t border-border/60 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-[var(--request-filter-max-width)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[var(--request-filter-max-width)]"
        style={{ "--request-filter-max-width": DESKTOP_FILTER_MAX_WIDTH } as CSSProperties}
      >
        <DialogHeader className="shrink-0 border-b border-border/40 px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className={titleClassName}>{t("list.filter.title")}</DialogTitle>
            {closeButton}
          </div>
        </DialogHeader>

        {body}

        <DialogFooter className="grid shrink-0 grid-cols-2 gap-2 border-t border-border/60 px-5 py-4 sm:grid-cols-2 sm:justify-stretch">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
