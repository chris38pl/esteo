"use client";

import { FileDown, Ellipsis } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function HeroPhoneEstimateMoreMenu({
  open,
  moreButtonHighlighted,
  savePdfHighlighted,
}: {
  open: boolean;
  moreButtonHighlighted: boolean;
  savePdfHighlighted: boolean;
}) {
  const t = useTranslations("estimates");

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("header.actions.more")}
        aria-expanded={open}
        className={cn(
          "hero-phone-status-more-btn flex shrink-0 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground shadow-xs transition-colors",
          moreButtonHighlighted && "border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/25",
        )}
      >
        <Ellipsis className="size-3.5" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hero-phone-more-menu absolute right-0 top-[calc(100%+4px)] z-50 min-w-[8.75rem] overflow-hidden rounded-md border border-border/60 bg-popover p-1 shadow-lg"
          >
            <div
              className={cn(
                "flex items-center gap-2 rounded-sm px-2 py-1.5 text-[10px] font-medium transition-colors",
                savePdfHighlighted
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground",
              )}
            >
              <FileDown className="size-3 shrink-0 opacity-80" />
              {t("header.actions.savePdf")}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
