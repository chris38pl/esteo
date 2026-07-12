"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import type { LegalSection } from "@/features/marketing/content/legal-content";
import { TrustLegalTable } from "@/features/marketing/components/trust-center/trust-legal-table";
import { cn } from "@/lib/utils";

type LegalDocumentAccordionProps = {
  sections: LegalSection[];
};

export function LegalDocumentAccordion({ sections }: LegalDocumentAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="overflow-hidden rounded-xl border border-border/35 bg-card/20">
      {sections.map((section, index) => {
        const isOpen = openIndex === index;
        const sectionNumber = index + 1;

        return (
          <div
            key={section.title}
            className={cn(
              index > 0 && "border-t border-border/35",
              isOpen && "border-blue-500/35 bg-blue-500/[0.06]",
            )}
          >
            <button
              type="button"
              id={`legal-section-${index}`}
              aria-expanded={isOpen}
              aria-controls={`legal-panel-${index}`}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-4 text-left transition sm:gap-4 sm:px-5 sm:py-[1.125rem]",
                !isOpen && "hover:bg-muted/20",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full transition",
                  isOpen
                    ? "bg-blue-600 text-white shadow-[0_0_16px_-6px_rgba(59,130,246,0.8)]"
                    : "text-muted-foreground",
                )}
              >
                {isOpen ? (
                  <Minus className="size-3.5" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Plus className="size-4" strokeWidth={2} aria-hidden />
                )}
              </span>

              <span
                className={cn(
                  "min-w-0 flex-1 text-sm leading-6 sm:text-[0.9375rem] sm:leading-6",
                  isOpen ? "font-semibold text-foreground" : "font-medium text-foreground/95",
                )}
              >
                {sectionNumber}. {section.title}
              </span>
            </button>

            {isOpen ? (
              <div
                id={`legal-panel-${index}`}
                role="region"
                aria-labelledby={`legal-section-${index}`}
                className="space-y-3 px-4 pb-5 sm:px-5 sm:pb-6"
              >
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="pl-10 text-sm leading-7 text-muted-foreground sm:pl-11 sm:text-[0.9375rem]"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.table ? (
                  <div className="pl-10 sm:pl-11">
                    <TrustLegalTable table={section.table} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
