"use client";

import { ChevronUp, Minus, Plus } from "lucide-react";
import { useState } from "react";

import type { FaqItem } from "@/features/marketing/content/faq-content";
import { trackMarketingEvent } from "@/features/marketing/lib/track-marketing-event";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

type FaqAccordionProps = {
  items: FaqItem[];
  page: string;
  locale: Locale;
  defaultOpenId?: string;
};

export function FaqAccordion({ items, page, locale, defaultOpenId }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? items[0]?.id ?? null);

  return (
    <div className="overflow-hidden rounded-xl border border-border/35 bg-card/20">
      {items.map((item, index) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className={cn(
              index > 0 && "border-t border-border/35",
              isOpen && "border-blue-500/35 bg-blue-500/[0.06]",
            )}
          >
            <button
              type="button"
              id={`faq-${item.id}`}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${item.id}`}
              onClick={() => {
                const nextOpen = isOpen ? null : item.id;
                setOpenId(nextOpen);
                if (nextOpen) {
                  trackMarketingEvent("faq_expanded", {
                    locale,
                    page,
                    question_id: item.id,
                  });
                }
              }}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-4 text-left transition sm:gap-4 sm:px-5 sm:py-[1.125rem]",
                !isOpen && "hover:bg-muted/20",
              )}
            >
              {isOpen ? (
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-blue-600 text-white shadow-[0_0_16px_-6px_rgba(59,130,246,0.8)]">
                  <Minus className="size-3.5" strokeWidth={2.5} aria-hidden />
                </span>
              ) : (
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center text-muted-foreground">
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                </span>
              )}

              <span
                className={cn(
                  "min-w-0 flex-1 text-sm leading-6 sm:text-[0.9375rem] sm:leading-6",
                  isOpen ? "font-semibold text-foreground" : "font-medium text-foreground/95",
                )}
              >
                {item.question}
              </span>

              {isOpen ? (
                <ChevronUp className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
            </button>

            {isOpen ? (
              <div
                id={`faq-panel-${item.id}`}
                role="region"
                aria-labelledby={`faq-${item.id}`}
                className="px-4 pb-5 sm:px-5 sm:pb-6"
              >
                <p className="pl-10 text-sm leading-6 text-muted-foreground sm:pl-11 sm:text-[0.9375rem] sm:leading-7">
                  {item.answer}
                </p>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
