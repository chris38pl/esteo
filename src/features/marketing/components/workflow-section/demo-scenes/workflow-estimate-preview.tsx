"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

import { AppToast } from "@/components/ui/app-toast";
import type { LineItemData } from "@/features/estimates/components/estimate-line-item-row";
import { calculateEstimate, calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { formatEstimateDecimal } from "@/features/estimates/lib/format-estimate-currency";
import { heroAnimationContent } from "@/features/marketing/components/hero/hero-animation-data";
import { HeroAnimatedCurrency } from "@/features/marketing/components/hero/hero-phone-animated-currency";
import {
  getHeroEditedItemValues,
  getHeroEstimateSections,
  HERO_EDIT_ITEM_ID,
  HERO_EXPAND_SECTION_ID,
  HERO_PHONE_PHASE,
  isHeroEstimateEdited,
} from "@/features/marketing/components/hero/hero-phone-demo-data";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const CURRENCY = "PLN";
const WORKFLOW_SECTION_COUNT = 3;
const WORKFLOW_EXPANDED_ITEM_COUNT = 2;

export const WORKFLOW_EXPAND_SECTION_ID = HERO_EXPAND_SECTION_ID;

function getWorkflowEstimateSections(locale: Locale) {
  return getHeroEstimateSections(locale)
    .slice(0, WORKFLOW_SECTION_COUNT)
    .map((section) =>
      section.id === WORKFLOW_EXPAND_SECTION_ID
        ? { ...section, items: section.items.slice(0, WORKFLOW_EXPANDED_ITEM_COUNT) }
        : section,
    );
}

function resolveWorkflowItem(
  item: LineItemData,
  highlightedItemId: string | null,
  heroPhase: number,
  sheetQuantity: number,
  sheetUnitPrice: number,
  sheetItemName: string,
): LineItemData {
  if (item.id !== highlightedItemId) {
    return item;
  }

  const showEdited = isHeroEstimateEdited(heroPhase);

  return {
    ...item,
    name: showEdited ? sheetItemName : item.name,
    quantity: showEdited ? sheetQuantity : item.quantity,
    unitPrice: showEdited ? sheetUnitPrice : item.unitPrice,
    baseUnitPrice: showEdited ? sheetUnitPrice : item.baseUnitPrice,
  };
}

function WorkflowEstimateSectionRow({
  sectionNumber,
  title,
  items,
  locale,
  expanded,
  highlightedItemId,
  heroPhase,
  sheetQuantity,
  sheetUnitPrice,
  sheetItemName,
  countUpOnMount,
  animateEditedTotals,
  countUpDurationMs,
}: {
  sectionNumber: number;
  title: string;
  items: LineItemData[];
  locale: string;
  expanded: boolean;
  highlightedItemId: string | null;
  heroPhase: number;
  sheetQuantity: number;
  sheetUnitPrice: number;
  sheetItemName: string;
  countUpOnMount: boolean;
  animateEditedTotals: boolean;
  countUpDurationMs: number;
}) {
  const resolvedItems = items.map((item) =>
    resolveWorkflowItem(
      item,
      highlightedItemId,
      heroPhase,
      sheetQuantity,
      sheetUnitPrice,
      sheetItemName,
    ),
  );

  const sectionCalc = calculateEstimate(
    resolvedItems.map((entry) => ({
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      vatRate: entry.vatRate,
    })),
    0,
  );

  return (
    <div>
      <div className="flex items-center gap-2 px-2.5 py-2.5">
        <ChevronRight
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-300",
            expanded && "rotate-90",
          )}
        />
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-tight text-foreground">
          {sectionNumber}. {title}
        </p>
        <p className="shrink-0 text-[13px] font-semibold text-primary">
          <HeroAnimatedCurrency
            value={sectionCalc.totalGross}
            currency={CURRENCY}
            locale={locale}
            className="font-semibold"
            countUpOnMount={countUpOnMount}
            durationMs={countUpDurationMs}
            highlightOnChange={animateEditedTotals}
          />
        </p>
      </div>

      {expanded ? (
        <div className="space-y-0.5 bg-background/30 px-2.5 py-1.5 pb-2.5">
          {resolvedItems.map((entry, index) => {
            const line = calculateLineItem({
              quantity: entry.quantity,
              unitPrice: entry.unitPrice,
              vatRate: entry.vatRate,
            });

            const isHighlighted = entry.id === highlightedItemId;
            const isEditedLine = animateEditedTotals && isHighlighted;

            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start justify-between gap-2 rounded-md py-2 last:pb-1",
                  isHighlighted && "bg-primary/5 ring-1 ring-primary/20",
                )}
              >
                <div className="flex min-w-0 items-start gap-2 text-xs leading-snug">
                  <span className="shrink-0 font-medium text-foreground/90">
                    {sectionNumber}.{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-muted-foreground">
                      <span className={cn("text-foreground", isEditedLine && "font-medium text-primary")}>
                        {entry.name}
                      </span>
                      <span className="text-muted-foreground/70"> · </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {formatEstimateDecimal(entry.quantity, locale)} × {entry.unit ?? "-"}
                      </span>
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-xs font-medium text-foreground">
                  <HeroAnimatedCurrency
                    value={line.grossValue}
                    currency={CURRENCY}
                    locale={locale}
                    className="font-medium text-foreground"
                    countUpOnMount={countUpOnMount && !isEditedLine}
                    durationMs={countUpDurationMs}
                    highlightOnChange={isEditedLine}
                  />
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export type WorkflowEstimateStatusKey = "DRAFT" | "SENT" | "ACCEPTED";

export function getWorkflowDemoGrossTotal(
  marketingLocale: Locale,
  heroPhase = HERO_PHONE_PHASE.TOTALS_COUNTUP,
) {
  const sections = getWorkflowEstimateSections(marketingLocale);
  const editedValues = getHeroEditedItemValues(heroPhase, marketingLocale);

  const allItems = sections.flatMap((section) =>
    section.items.map((item) =>
      resolveWorkflowItem(
        item,
        HERO_EDIT_ITEM_ID,
        heroPhase,
        editedValues.quantity,
        editedValues.unitPrice,
        editedValues.editedName,
      ),
    ),
  );

  const calc = calculateEstimate(
    allItems.map((entry) => ({
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      vatRate: entry.vatRate,
    })),
    0,
  );

  return Math.round(calc.totalGross);
}
function WorkflowEstimateSummaryBlock({
  calc,
  formatLocale,
  countUpOnMount,
  animateEditedTotals,
  countUpDurationMs,
}: {
  calc: ReturnType<typeof calculateEstimate>;
  formatLocale: string;
  countUpOnMount: boolean;
  animateEditedTotals: boolean;
  countUpDurationMs: number;
}) {
  const t = useTranslations("estimates");

  return (
    <div className="bg-card/40 px-3 pt-3 pb-2">
      <p className="mb-2 text-[13px] font-semibold text-primary">{t("summary.title")}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{t("summary.net")}</span>
          <HeroAnimatedCurrency
            value={calc.totalNet}
            currency={CURRENCY}
            locale={formatLocale}
            className="font-medium text-foreground"
            countUpOnMount={countUpOnMount}
            durationMs={countUpDurationMs}
            highlightOnChange={animateEditedTotals}
          />
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{t("summary.vat")} (23%)</span>
          <HeroAnimatedCurrency
            value={calc.totalVat}
            currency={CURRENCY}
            locale={formatLocale}
            className="font-medium text-foreground"
            countUpOnMount={countUpOnMount}
            durationMs={countUpDurationMs}
            highlightOnChange={animateEditedTotals}
          />
        </div>
      </div>
    </div>
  );
}

function WorkflowEstimateSectionsBlock({
  marketingLocale,
  sections,
  expandedSectionId,
  highlightedItemId,
  heroPhase,
  editedValues,
  countUpOnMount,
  animateEditedTotals,
  countUpDurationMs,
  standalone = false,
}: {
  marketingLocale: Locale;
  sections: ReturnType<typeof getWorkflowEstimateSections>;
  expandedSectionId: string | null;
  highlightedItemId: string | null;
  heroPhase: number;
  editedValues: ReturnType<typeof getHeroEditedItemValues>;
  countUpOnMount: boolean;
  animateEditedTotals: boolean;
  countUpDurationMs: number;
  standalone?: boolean;
}) {
  const t = useTranslations("estimates");

  return (
    <div className={cn(!standalone && "border-t border-border/[0.06]")}>
      <div className="flex items-center justify-between px-2.5 py-2">
        <p className="text-[13px] font-semibold text-primary">{t("editor.itemsEyebrow")}</p>
        <span className="rounded-full bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {sections.length} {marketingLocale === "pl" ? "sekcje" : "sections"}
        </span>
      </div>

      <div className="divide-y divide-border/[0.06]">
        {sections.map((section, index) => (
          <WorkflowEstimateSectionRow
            key={section.id}
            sectionNumber={index + 1}
            title={section.title}
            items={section.items}
            locale={marketingLocale === "pl" ? "pl-PL" : "en-US"}
            expanded={expandedSectionId === section.id}
            highlightedItemId={highlightedItemId}
            heroPhase={heroPhase}
            sheetQuantity={editedValues.quantity}
            sheetUnitPrice={editedValues.unitPrice}
            sheetItemName={editedValues.editedName}
            countUpOnMount={countUpOnMount}
            animateEditedTotals={animateEditedTotals}
            countUpDurationMs={countUpDurationMs}
          />
        ))}
      </div>
    </div>
  );
}

export function WorkflowEstimatePreview({
  marketingLocale,
  expandedSectionId = null,
  highlightedItemId = null,
  heroPhase = HERO_PHONE_PHASE.ESTIMATE_IDLE,
  statusKey = "DRAFT",
  toastVariant = null,
  sendHighlighted = false,
}: {
  marketingLocale: Locale;
  expandedSectionId?: string | null;
  highlightedItemId?: string | null;
  heroPhase?: number;
  statusKey?: WorkflowEstimateStatusKey;
  toastVariant?: "loading" | "success" | null;
  sendHighlighted?: boolean;
}) {
  const t = useTranslations("estimates");
  const intlLocale = useLocale();
  const formatLocale = intlLocale === "pl" ? "pl-PL" : "en-US";
  const sections = getWorkflowEstimateSections(marketingLocale);
  const title = heroAnimationContent[marketingLocale].estimateTitle;
  const editedValues = getHeroEditedItemValues(heroPhase, marketingLocale);
  const countUpOnMount = heroPhase <= HERO_PHONE_PHASE.SECTION_EXPAND;
  const animateEditedTotals = heroPhase >= HERO_PHONE_PHASE.TOTALS_COUNTUP;
  const countUpDurationMs = animateEditedTotals ? 1400 : 1200;

  const allItems = sections.flatMap((section) =>
    section.items.map((item) =>
      resolveWorkflowItem(
        item,
        highlightedItemId,
        heroPhase,
        editedValues.quantity,
        editedValues.unitPrice,
        editedValues.editedName,
      ),
    ),
  );

  const calc = calculateEstimate(
    allItems.map((entry) => ({
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      vatRate: entry.vatRate,
    })),
    0,
  );
  const grossTotal = Math.round(calc.totalGross);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      {toastVariant ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={toastVariant}
            initial={{ opacity: 0, y: -14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center px-3"
          >
            <div className="w-full max-w-[11.5rem]">
              <AppToast
                variant={toastVariant === "loading" ? "loading" : "success"}
                title={
                  toastVariant === "loading"
                    ? t("send.progress.generatingPdf")
                    : t("send.success")
                }
                showProgress={toastVariant === "loading"}
                progressDurationMs={toastVariant === "loading" ? 3400 : undefined}
                size="compact"
                hideDismiss
                className="shadow-md"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      ) : null}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-1 pb-0 pt-0.5">
          <h3 className="min-w-0 flex-1 text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <span
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-xs",
              statusKey === "ACCEPTED"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                : statusKey === "SENT"
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border/60 bg-card text-muted-foreground",
            )}
          >
            {t(`status.${statusKey}`)}
          </span>
        </div>

        <div className="space-y-2.5">
          <div className="overflow-hidden rounded-xl bg-card/40">
            <WorkflowEstimateSummaryBlock
              calc={calc}
              formatLocale={formatLocale}
              countUpOnMount={countUpOnMount}
              animateEditedTotals={animateEditedTotals}
              countUpDurationMs={countUpDurationMs}
            />
          </div>
          <div className="overflow-hidden rounded-xl bg-card/30">
            <WorkflowEstimateSectionsBlock
              marketingLocale={marketingLocale}
              sections={sections}
              expandedSectionId={expandedSectionId}
              highlightedItemId={highlightedItemId}
              heroPhase={heroPhase}
              editedValues={editedValues}
              countUpOnMount={countUpOnMount}
              animateEditedTotals={animateEditedTotals}
              countUpDurationMs={countUpDurationMs}
              standalone
            />
          </div>
        </div>
      </div>

      <div className="-mb-1 mt-1.5 grid shrink-0 grid-cols-2 gap-3 border-t border-border/40 pt-2">
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-xs text-muted-foreground">{t("summary.gross")}</p>
          <p className="truncate text-base font-bold text-primary">
            <HeroAnimatedCurrency
              value={grossTotal}
              currency={CURRENCY}
              locale={formatLocale}
              className="font-bold"
              countUpOnMount={countUpOnMount}
              durationMs={countUpDurationMs}
              highlightOnChange={animateEditedTotals}
            />
          </p>
        </div>
        <div className="flex items-center justify-end">
          <span
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-shadow",
              sendHighlighted && "ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
            )}
          >
            {t("header.actions.send")}
          </span>
        </div>
      </div>
    </div>
  );
}