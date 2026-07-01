"use client";

import { ChevronRight, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { AppToast } from "@/components/ui/app-toast";
import type { LineItemData } from "@/features/estimates/components/estimate-line-item-row";
import { calculateEstimate, calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { HeroPhoneEstimateMoreMenu } from "@/features/marketing/components/hero/hero-phone-estimate-more-menu";
import { HeroPhoneInlinePositionSheet } from "@/features/marketing/components/hero/hero-phone-inline-position-sheet";
import { HeroAnimatedCurrency } from "@/features/marketing/components/hero/hero-phone-animated-currency";
import { HERO_PHONE_PHASE, isHeroEstimateEdited } from "@/features/marketing/components/hero/hero-phone-demo-data";
import { cn } from "@/lib/utils";

const CURRENCY = "PLN";

function resolveItem(
  item: LineItemData,
  highlightedItemId: string | null,
  phase: number,
  sheetQuantity: number,
  sheetUnitPrice: number,
  sheetItemName: string,
): LineItemData {
  if (item.id !== highlightedItemId) {
    return item;
  }

  const showEdited = isHeroEstimateEdited(phase);
  return {
    ...item,
    name: showEdited ? sheetItemName : item.name,
    quantity: showEdited ? sheetQuantity : item.quantity,
    unitPrice: showEdited ? sheetUnitPrice : item.unitPrice,
    baseUnitPrice: showEdited ? sheetUnitPrice : item.baseUnitPrice,
  };
}

function HeroEstimateSectionRow({
  sectionNumber,
  title,
  items,
  currency,
  locale,
  expanded,
  highlighted: _highlighted,
  phase,
  highlightedItemId,
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
  currency: string;
  locale: string;
  expanded: boolean;
  highlighted: boolean;
  phase: number;
  highlightedItemId: string | null;
  sheetQuantity: number;
  sheetUnitPrice: number;
  sheetItemName: string;
  countUpOnMount: boolean;
  animateEditedTotals: boolean;
  countUpDurationMs: number;
}) {
  const resolvedItems = items.map((item) =>
    resolveItem(item, highlightedItemId, phase, sheetQuantity, sheetUnitPrice, sheetItemName),
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
      <div className="flex items-center gap-1.5 px-2 py-2.5">
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium leading-tight text-foreground">
          {sectionNumber}. {title}
        </p>
        <p className="shrink-0 text-[12px] font-semibold text-primary">
          <HeroAnimatedCurrency
            value={sectionCalc.totalGross}
            currency={currency}
            locale={locale}
            className="font-semibold"
            countUpOnMount={countUpOnMount}
            durationMs={countUpDurationMs}
            highlightOnChange={animateEditedTotals}
          />
        </p>
      </div>

      {expanded ? (
        <div className="space-y-1 bg-background/30 px-2 py-1.5 pb-2">
          {resolvedItems.map((entry, index) => {
            const line = calculateLineItem({
              quantity: entry.quantity,
              unitPrice: entry.unitPrice,
              vatRate: entry.vatRate,
            });

            const isEditedLine =
              animateEditedTotals && entry.id === highlightedItemId && highlightedItemId !== null;

            return (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-2 py-2 last:pb-1"
              >
                <p className="flex min-w-0 items-start gap-2.5 text-[11px] leading-snug text-muted-foreground">
                  <span className="shrink-0 font-medium text-foreground/90">
                    {sectionNumber}.{index + 1}
                  </span>
                  <span>{entry.name}</span>
                </p>
                <p className="shrink-0 text-[11px] font-medium text-foreground">
                  <HeroAnimatedCurrency
                    value={line.grossValue}
                    currency={currency}
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

export function HeroPhoneEstimateScreen({
  title,
  sections,
  phase,
  expandedSectionId,
  highlightedItemId,
  sheetOpen,
  sheetItem,
  sheetPositionLabel,
  sheetQuantity,
  sheetUnitPrice,
  sheetItemName,
  toastVariant,
}: {
  title: string;
  sections: Array<{ id: string; title: string; items: LineItemData[] }>;
  phase: number;
  expandedSectionId: string | null;
  highlightedItemId: string | null;
  sheetOpen: boolean;
  sheetItem: LineItemData | null;
  sheetPositionLabel: string;
  sheetQuantity: number;
  sheetUnitPrice: number;
  sheetItemName: string;
  toastVariant: "loading" | "success" | null;
}) {
  const t = useTranslations("estimates");
  const locale = useLocale();

  const allItems = sections.flatMap((section) =>
    section.items.map((item) => resolveItem(item, highlightedItemId, phase, sheetQuantity, sheetUnitPrice, sheetItemName)),
  );

  const calc = calculateEstimate(
    allItems.map((entry) => ({
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      vatRate: entry.vatRate,
    })),
    0,
  );

  const formatLocale = locale === "pl" ? "pl-PL" : "en-US";
  const grossTotal = Math.round(calc.totalGross);
  const isSent = phase >= HERO_PHONE_PHASE.TOAST_SUCCESS;
  const statusLabel = isSent ? t("status.SENT") : t("status.DRAFT");
  const animateEditedTotals =
    phase >= HERO_PHONE_PHASE.TOTALS_COUNTUP && phase < HERO_PHONE_PHASE.MORE_MENU_OPEN;
  const countUpDurationMs = animateEditedTotals ? 1400 : 1200;
  const countUpOnMount = true;
  const moreMenuOpen =
    phase >= HERO_PHONE_PHASE.MORE_MENU_OPEN && phase < HERO_PHONE_PHASE.TOAST_LOADING;
  const moreButtonHighlighted =
    phase === HERO_PHONE_PHASE.MORE_MENU_OPEN || phase === HERO_PHONE_PHASE.SAVE_PDF_CLICK;
  const savePdfHighlighted = phase >= HERO_PHONE_PHASE.SAVE_PDF_CLICK && phase < HERO_PHONE_PHASE.TOAST_LOADING;

  return (
    <div className="hero-phone-estimate relative flex h-full flex-col bg-background">
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-1.5 pt-5 pb-2">
        <div className="flex items-center justify-between gap-2 pl-2 pr-[7px] pb-1 pt-1">
          <h1 className="min-w-0 flex-1 text-[13px] font-semibold leading-[1.75rem] tracking-tight text-foreground">
            {title}
          </h1>
          <div className="flex shrink-0 items-center gap-1.5">
            <motion.span
              key={statusLabel}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "hero-phone-status-badge inline-flex items-center justify-center rounded-md border font-medium shadow-xs",
                isSent
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "border-border/60 bg-card text-muted-foreground",
              )}
            >
              {statusLabel}
            </motion.span>
            <HeroPhoneEstimateMoreMenu
              open={moreMenuOpen}
              moreButtonHighlighted={moreButtonHighlighted}
              savePdfHighlighted={savePdfHighlighted}
            />
          </div>
        </div>

        <div className="hero-phone-summary-card rounded-xl bg-card/40 px-2 pt-2.5 pb-2">
          <p className="mb-2 text-[12px] font-semibold text-primary">{t("summary.title")}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
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
            <div className="flex items-center justify-between gap-2 text-[11px]">
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

        <div className="hero-phone-sections-card overflow-hidden rounded-xl bg-card/30">
          <div className="flex items-center justify-between px-2 py-2">
            <p className="text-[12px] font-semibold text-primary">{t("editor.itemsEyebrow")}</p>
            <span className="rounded-full bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {sections.length} {locale === "pl" ? "sekcje" : "sections"}
            </span>
          </div>

          <div className="divide-y divide-border/[0.06]">
            {sections.map((section, index) => (
              <HeroEstimateSectionRow
                key={section.id}
                sectionNumber={index + 1}
                title={section.title}
                items={section.items}
                currency={CURRENCY}
                locale={locale === "pl" ? "pl-PL" : "en-US"}
                expanded={expandedSectionId === section.id}
                highlighted={expandedSectionId === section.id}
                phase={phase}
                highlightedItemId={highlightedItemId}
                sheetQuantity={sheetQuantity}
                sheetUnitPrice={sheetUnitPrice}
                sheetItemName={sheetItemName}
                countUpOnMount={countUpOnMount}
                animateEditedTotals={animateEditedTotals}
                countUpDurationMs={countUpDurationMs}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="hero-phone-estimate-sticky-bar z-20 grid shrink-0 -translate-y-[7px] grid-cols-2 gap-2 border-t border-border/40 bg-card px-[15px] pt-2 pb-[10px]">
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-[11px] text-muted-foreground">{t("summary.gross")}</p>
          <p className="truncate text-[14px] font-bold text-primary">
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
        <Button
          type="button"
          size="sm"
          disabled={isSent}
          className={cn(
            "hero-phone-send-btn w-full gap-1 text-[11px] font-semibold",
            isSent && "opacity-50",
          )}
        >
          {t("header.actions.send")}
          <Send className="size-3" />
        </Button>
      </div>

      <HeroPhoneInlinePositionSheet
        open={sheetOpen}
        item={sheetItem}
        positionLabel={sheetPositionLabel}
        quantity={sheetQuantity}
        unitPrice={sheetUnitPrice}
        itemName={sheetItemName}
        editing={phase >= HERO_PHONE_PHASE.SHEET_OPEN && phase < HERO_PHONE_PHASE.SHEET_EDIT}
        saving={phase >= HERO_PHONE_PHASE.SHEET_EDIT && phase <= HERO_PHONE_PHASE.SHEET_SAVE}
      />

      {toastVariant ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={toastVariant}
            initial={{ opacity: 0, y: -14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute left-[15px] right-[15px] top-[15px] z-40"
          >
            <AppToast
              variant={toastVariant === "loading" ? "loading" : "success"}
              title={
                toastVariant === "loading"
                  ? t("send.progress.generatingPdf")
                  : t("send.success")
              }
              description={undefined}
              showProgress={toastVariant === "loading"}
              progressDurationMs={toastVariant === "loading" ? 3400 : undefined}
              size="compact"
              hideDismiss
              className="hero-phone-toast hero-phone-toast-floating"
            />
          </motion.div>
        </AnimatePresence>
      ) : null}
    </div>
  );
}
