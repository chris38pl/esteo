"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { ResolvedFieldItem } from "@/features/voice-intake/lib/diff-missing-fields";
import {
  RESOLVED_FIELD_ACCENT,
  RESOLVED_FIELD_ICONS,
  resolveFieldFriendlyKey,
} from "@/features/voice-intake/lib/resolved-field-display";

const STEP_EASE = [0.22, 1, 0.36, 1] as const;

function enterTransition(reduced: boolean, duration = 0.28) {
  return reduced ? { duration: 0 } : { duration, ease: STEP_EASE };
}

export function VoiceSummaryResolvedItems({ items }: { items: ResolvedFieldItem[] }) {
  const t = useTranslations("voiceIntake.followUpSuccess");
  const tLabels = useTranslations("voiceIntake.review.missingFriendly");
  const prefersReducedMotion = useReducedMotion() ?? false;

  if (items.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enterTransition(prefersReducedMotion, 0.32)}
      className="w-full rounded-2xl border border-border/50 bg-card/50 px-4 py-3.5 text-left"
    >
      <h3 className="text-sm font-semibold tracking-tight text-foreground">{t("addedHeading")}</h3>

      <motion.ul
        className="mt-2"
        initial={prefersReducedMotion ? false : "hidden"}
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: prefersReducedMotion
              ? { duration: 0 }
              : { staggerChildren: 0.08, delayChildren: 0.06 },
          },
        }}
      >
        {items.map((item, index) => {
          const friendlyKey = resolveFieldFriendlyKey(item.fieldKey);
          const Icon = RESOLVED_FIELD_ICONS[friendlyKey];
          const accent = RESOLVED_FIELD_ACCENT[friendlyKey];
          const label = tLabels(friendlyKey);

          return (
            <motion.li
              key={item.fieldKey}
              variants={{
                hidden: prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              transition={enterTransition(prefersReducedMotion)}
            >
              {index > 0 ? <div className="border-t border-border/40" aria-hidden /> : null}
              <div className="flex items-center gap-3 py-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{item.displayValue}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                </span>
              </div>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.section>
  );
}
