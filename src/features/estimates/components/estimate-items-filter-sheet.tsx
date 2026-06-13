"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Hash, Plus, Type, X } from "lucide-react";
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
import { isValidDecimalDraft } from "@/lib/decimal-input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEstimateMobileLayout } from "@/features/estimates/hooks/use-estimate-mobile-layout";
import type { SectionData } from "./estimate-items-table";
import {
  EMPTY_ESTIMATE_ITEMS_FILTER,
  countVisibleItems,
  createFilterCondition,
  getFilterFieldsForMode,
  isTextFilterField,
  operatorsForField,
  type EstimateFilterCondition,
  type EstimateFilterField,
  type EstimateFilterLogic,
  type EstimateItemsFilterState,
} from "@/features/estimates/lib/estimate-item-filter";
import { estimateOutlineButtonClassName, estimatePrimaryButtonClassName } from "./estimate-action-button-styles";
import { cn } from "@/lib/utils";

interface EstimateItemsFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SectionData[];
  advancedMode: boolean;
  searchQuery: string;
  appliedFilter: EstimateItemsFilterState;
  onApply: (filter: EstimateItemsFilterState) => void;
}

const selectClassName =
  "h-9 min-w-0 flex-1 rounded-md border border-border/60 bg-muted/20 px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

const DESKTOP_FILTER_MAX_WIDTH = "32rem";

function FilterFieldIcon({ field }: { field: EstimateFilterField }) {
  const Icon = isTextFilterField(field) ? Type : Hash;
  return (
    <span className="estimate-mobile-position-icon flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4 text-primary dark:text-muted-foreground" aria-hidden />
    </span>
  );
}

export function EstimateItemsFilterSheet({
  open,
  onOpenChange,
  sections,
  advancedMode,
  searchQuery,
  appliedFilter,
  onApply,
}: EstimateItemsFilterSheetProps) {
  const t = useTranslations("estimates");
  const isMobile = useEstimateMobileLayout();
  const [draft, setDraft] = useState<EstimateItemsFilterState>(appliedFilter);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(appliedFilter);
    } else {
      setFieldPickerOpen(false);
    }
  }, [open, appliedFilter]);

  const availableFields = getFilterFieldsForMode(advancedMode);
  const usedFields = new Set(draft.conditions.map((condition) => condition.field));
  const addableFields = availableFields.filter((field) => !usedFields.has(field));

  const unitOptions = useMemo(() => {
    const units = new Set<string>();
    for (const section of sections) {
      for (const item of section.items) {
        if (item.unit?.trim()) {
          units.add(item.unit);
        }
      }
    }
    return Array.from(units).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [sections]);

  const allItems = useMemo(
    () => sections.flatMap((section) => section.items),
    [sections],
  );

  const previewCount = countVisibleItems(allItems, {
    searchQuery,
    filter: draft,
  });

  const updateCondition = (id: string, patch: Partial<EstimateFilterCondition>) => {
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

  const addCondition = (field: EstimateFilterField) => {
    setDraft((prev) => ({
      ...prev,
      conditions: [...prev.conditions, createFilterCondition(field)],
    }));
    setFieldPickerOpen(false);
  };

  const clearDraft = () => {
    setDraft(EMPTY_ESTIMATE_ITEMS_FILTER);
    onApply(EMPTY_ESTIMATE_ITEMS_FILTER);
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
      aria-label={t("editor.filter.close")}
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
          <h3 className="text-sm font-semibold text-foreground">{t("editor.filter.fieldsTitle")}</h3>
          {draft.conditions.length > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setDraft((prev) => ({ ...prev, conditions: [] }))}
            >
              {t("editor.filter.clearAll")}
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
                  {t(`editor.filter.fields.${condition.field}`)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground"
                  aria-label={t("editor.filter.removeCondition")}
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
                      operator: event.target.value as EstimateFilterCondition["operator"],
                    })
                  }
                  className={selectClassName}
                  aria-label={t("editor.filter.operatorAria")}
                >
                  {operatorsForField(condition.field).map((operator) => (
                    <option key={operator} value={operator}>
                      {t(`editor.filter.operators.${operator}`)}
                    </option>
                  ))}
                </select>

                {condition.field === "unit" && unitOptions.length > 0 ? (
                  <select
                    value={condition.value}
                    onChange={(event) =>
                      updateCondition(condition.id, { value: event.target.value })
                    }
                    className={selectClassName}
                    aria-label={t("editor.filter.valueAria")}
                  >
                    <option value="">{t("editor.filter.valuePlaceholder.unit")}</option>
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    inputMode={isTextFilterField(condition.field) ? undefined : "decimal"}
                    value={condition.value}
                    onChange={(event) => {
                      const next = event.target.value;
                      if (!isTextFilterField(condition.field) && !isValidDecimalDraft(next)) {
                        return;
                      }
                      updateCondition(condition.id, { value: next });
                    }}
                    placeholder={
                      isTextFilterField(condition.field)
                        ? t("editor.filter.valuePlaceholder.text")
                        : t("editor.filter.valuePlaceholder.number")
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
                aria-label={t("editor.filter.chooseField")}
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/40 px-3 py-2.5">
                  <p className="text-sm font-semibold text-foreground">
                    {t("editor.filter.chooseField")}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground"
                    aria-label={t("editor.filter.closeFieldPicker")}
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
                      <span>{t(`editor.filter.fields.${field}`)}</span>
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
                  {t("editor.filter.cancelAdd")}
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("editor.filter.addFilter")}
                </>
              )}
            </button>
          </div>
        ) : null}
      </section>

      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold text-foreground">{t("editor.filter.logicTitle")}</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["and", "or"] as EstimateFilterLogic[]).map((logic) => {
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
                {t(`editor.filter.logic.${logic}`)}
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
        {t("editor.filter.clear")}
      </Button>
      <Button type="button" className={estimatePrimaryButtonClassName} onClick={applyDraft}>
        {t("editor.filter.showResults", { count: previewCount })}
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
              <SheetTitle className={titleClassName}>{t("editor.filter.title")}</SheetTitle>
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
        className="flex max-h-[min(90vh,720px)] w-[calc(100%-2rem)] max-w-[var(--estimate-filter-max-width)] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-[var(--estimate-filter-max-width)]"
        style={{ "--estimate-filter-max-width": DESKTOP_FILTER_MAX_WIDTH } as CSSProperties}
      >
        <DialogHeader className="shrink-0 border-b border-border/40 px-5 py-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle className={titleClassName}>{t("editor.filter.title")}</DialogTitle>
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
