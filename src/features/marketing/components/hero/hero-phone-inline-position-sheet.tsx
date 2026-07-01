"use client";

import { ArrowLeft, Coins, FileText, Hash, Percent, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { formatHeroPhoneCurrency } from "@/features/marketing/components/hero/format-hero-phone-currency";
import {
  estimateOutlineButtonClassName,
  estimatePrimaryButtonClassName,
} from "@/features/estimates/components/estimate-action-button-styles";
import {
  heroPhoneOutlineButtonClassName,
  heroPhonePrimaryButtonClassName,
} from "@/features/marketing/components/hero/hero-phone-button-styles";
import type { LineItemData } from "@/features/estimates/components/estimate-line-item-row";
import { cn } from "@/lib/utils";

const editRowClassName = "flex gap-2.5 py-2 pl-2.5 pr-2.5";

const sheetEase = [0.32, 0.72, 0, 1] as const;

function sheetPanelTransition(reducedMotion: boolean | null) {
  if (reducedMotion) {
    return { duration: 0 };
  }

  return {
    type: "spring" as const,
    damping: 32,
    stiffness: 340,
    mass: 0.9,
  };
}

function sheetPanelExitTransition(reducedMotion: boolean | null) {
  if (reducedMotion) {
    return { duration: 0 };
  }

  return {
    duration: 0.3,
    ease: sheetEase,
  };
}

function EditRowIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="estimate-mobile-position-icon flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4 text-primary" aria-hidden />
    </span>
  );
}

function useTypingValue(target: string, enabled: boolean, speedMs = 32) {
  const [value, setValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setValue("");
      setIsTyping(false);
      return;
    }

    setValue("");
    setIsTyping(true);
    let index = 0;

    const interval = window.setInterval(() => {
      index += 1;
      setValue(target.slice(0, index));

      if (index >= target.length) {
        window.clearInterval(interval);
        setIsTyping(false);
      }
    }, speedMs);

    return () => window.clearInterval(interval);
  }, [target, enabled, speedMs]);

  const done = enabled && value === target && !isTyping;

  return { value, isTyping, done };
}

function TypingCursor({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-3 w-px translate-y-0.5 animate-pulse bg-primary/80"
    />
  );
}

function AnimatedSheetFields({
  item,
  itemName,
  quantity,
  unitPrice,
  editing,
  saving,
  reducedMotion,
}: {
  item: LineItemData;
  itemName: string;
  quantity: number;
  unitPrice: number;
  editing: boolean;
  saving: boolean;
  reducedMotion: boolean;
}) {
  const t = useTranslations("estimates");
  const [nameTypingEnabled, setNameTypingEnabled] = useState(false);
  const [priceTypingEnabled, setPriceTypingEnabled] = useState(false);

  const formattedTargetPrice = formatHeroPhoneCurrency(unitPrice);
  const formattedOriginalPrice = formatHeroPhoneCurrency(item.baseUnitPrice);

  const nameTyping = useTypingValue(itemName, nameTypingEnabled && !reducedMotion);
  const priceTyping = useTypingValue(
    formattedTargetPrice,
    priceTypingEnabled && !reducedMotion,
    36,
  );

  useEffect(() => {
    if (!editing) {
      setNameTypingEnabled(false);
      setPriceTypingEnabled(false);
      return;
    }

    setNameTypingEnabled(false);
    setPriceTypingEnabled(false);

    const startTimer = window.setTimeout(() => {
      setNameTypingEnabled(true);
    }, 400);

    return () => window.clearTimeout(startTimer);
  }, [editing]);

  useEffect(() => {
    if (nameTyping.done && nameTypingEnabled && !priceTypingEnabled) {
      const nextTimer = window.setTimeout(() => {
        setPriceTypingEnabled(true);
      }, 120);

      return () => window.clearTimeout(nextTimer);
    }
  }, [nameTyping.done, nameTypingEnabled, priceTypingEnabled]);

  const displayQuantity = quantity;

  const displayName = saving || reducedMotion
    ? itemName
    : !nameTypingEnabled
      ? item.name
      : nameTyping.value;

  const displayUnitPrice = saving || reducedMotion
    ? formattedTargetPrice
    : !priceTypingEnabled
      ? formattedOriginalPrice
      : priceTyping.value;

  const nameHighlighted =
    saving ||
    (reducedMotion && editing) ||
    (nameTypingEnabled && (nameTyping.isTyping || nameTyping.done));
  const priceHighlighted =
    saving ||
    (reducedMotion && editing) ||
    (priceTypingEnabled && (priceTyping.isTyping || priceTyping.done));

  const calc = calculateLineItem({
    quantity: displayQuantity,
    unitPrice: priceTyping.done || saving || reducedMotion ? unitPrice : item.baseUnitPrice,
    vatRate: item.vatRate,
  });

  return (
    <>
      <div className={cn(editRowClassName, "items-start")}>
        <EditRowIcon icon={FileText} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">{t("editor.columns.name")}</p>
          <motion.p
            initial={false}
            animate={{ scale: 1 }}
            className={cn(
              "mt-0.5 text-[11px] font-medium",
              nameHighlighted ? "text-primary" : "text-foreground",
            )}
          >
            {displayName}
            <TypingCursor visible={nameTyping.isTyping} />
          </motion.p>
        </div>
      </div>

      <div className={cn(editRowClassName, "items-center")}>
        <EditRowIcon icon={Hash} />
        <p className="min-w-0 flex-1 text-[11px] text-muted-foreground">{t("editor.columns.qty")}</p>
        <p className="text-[11px] font-semibold tabular-nums text-foreground">{displayQuantity}</p>
      </div>

      <div className={cn(editRowClassName, "items-center")}>
        <EditRowIcon icon={Coins} />
        <p className="min-w-0 flex-1 text-[11px] text-muted-foreground">{t("editor.columns.unitPrice")}</p>
        <motion.p
          initial={false}
          animate={{ scale: 1 }}
          className={cn(
            "text-[11px] font-semibold tabular-nums",
            priceHighlighted ? "text-primary" : "text-foreground",
          )}
        >
          {displayUnitPrice}
          <TypingCursor visible={priceTyping.isTyping} />
        </motion.p>
      </div>

      <div className={cn(editRowClassName, "items-center")}>
        <EditRowIcon icon={Percent} />
        <p className="min-w-0 flex-1 text-[11px] text-muted-foreground">{t("editor.mobile.vatPercent")}</p>
        <p className="text-[11px] font-semibold tabular-nums">{item.vatRate}%</p>
      </div>

      <div className="mx-2 mt-2.5 space-y-1 rounded-lg border border-border/60 bg-muted/15 px-2.5 py-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{t("editor.columns.gross")}</span>
          <span className="font-semibold tabular-nums text-primary">
            {formatHeroPhoneCurrency(calc.grossValue)}
          </span>
        </div>
      </div>
    </>
  );
}

export function HeroPhoneInlinePositionSheet({
  open,
  item,
  positionLabel,
  quantity,
  unitPrice,
  itemName,
  editing,
  saving,
}: {
  open: boolean;
  item: LineItemData | null;
  positionLabel: string;
  quantity: number;
  unitPrice: number;
  itemName: string;
  editing: boolean;
  saving: boolean;
}) {
  const t = useTranslations("estimates");
  const reducedMotion = useReducedMotion();
  const isVisible = open && item !== null;

  return (
    <AnimatePresence>
      {isVisible ? (
        <>
          <motion.div
            key="hero-position-sheet-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
            className="absolute inset-0 z-[39] bg-black/40"
            aria-hidden
          />
          <motion.div
            key="hero-position-sheet-panel"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { y: reducedMotion ? 0 : "100%" },
              visible: {
                y: 0,
                transition: sheetPanelTransition(reducedMotion),
              },
              exit: {
                y: reducedMotion ? 0 : "100%",
                transition: sheetPanelExitTransition(reducedMotion),
              },
            }}
            className="hero-phone-position-sheet absolute inset-0 z-40 flex flex-col bg-card shadow-[0_-12px_40px_rgba(0,0,0,0.22)] will-change-transform"
          >
            <div className="flex items-center justify-between gap-1 border-b border-border/40 px-3.5 pb-1.5 pt-2.5">
              <Button type="button" variant="ghost" size="icon-xs" className="shrink-0">
                <ArrowLeft className="size-3.5" />
              </Button>
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate text-[11px] font-semibold">{t("editor.mobile.editPosition")}</p>
                <p className="text-[10px] tabular-nums text-muted-foreground">{positionLabel}</p>
              </div>
              <Button type="button" variant="ghost" size="icon-xs" className="shrink-0">
                <X className="size-3.5" />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pt-2.5">
              <AnimatedSheetFields
                item={item}
                itemName={itemName}
                quantity={quantity}
                unitPrice={unitPrice}
                editing={editing}
                saving={saving}
                reducedMotion={Boolean(reducedMotion)}
              />
            </div>

            <div className="flex gap-1.5 border-t border-border/40 p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  estimateOutlineButtonClassName,
                  heroPhoneOutlineButtonClassName,
                  "hero-phone-position-sheet-btn flex-1",
                )}
              >
                {t("editor.mobile.cancel")}
              </Button>
              <Button
                type="button"
                size="sm"
                className={cn(
                  estimatePrimaryButtonClassName,
                  heroPhonePrimaryButtonClassName,
                  "hero-phone-position-sheet-btn flex-1",
                  saving && "ring-2 ring-primary/30",
                )}
              >
                {saving ? t("editor.mobile.saving") : t("editor.mobile.save")}
              </Button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
