"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import { VoiceConfidenceSummary } from "@/features/voice-intake/components/voice-confidence-summary";
import type { ConfidenceSummary } from "@/features/voice-intake/lib/build-confidence-summary";
import { cn } from "@/lib/utils";

const FIELD_KEYS = [
  "propertyType",
  "city",
  "area",
  "preferredStartDate",
  "address",
  "postalCode",
  "voivodeship",
  "fullName",
  "email",
  "phone",
] as const;

export function VoiceAdvancedDetails({
  extraction,
  confidenceSummary,
  initialTranscript,
  followUpTranscript,
}: {
  extraction: VoiceIntakeExtraction;
  confidenceSummary: ConfidenceSummary;
  initialTranscript: string;
  followUpTranscript?: string | null;
}) {
  const t = useTranslations("voiceIntake.review");
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/50 bg-muted/10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-muted-foreground transition hover:text-foreground"
        aria-expanded={open}
      >
        <span>{t("showTechnicalDetails")}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border/50 px-4 py-4">
          <VoiceConfidenceSummary summary={confidenceSummary} />

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("extractedFields")}
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {FIELD_KEYS.map((key) => {
                const field = extraction[key];
                const value = "value" in field ? String(field.value ?? "-") : "-";
                const confidence = "confidence" in field ? Math.round(field.confidence * 100) : 0;
                return (
                  <li key={key} className="flex justify-between gap-4">
                    <span className="text-foreground/70">{key}</span>
                    <span className="text-right">
                      {value}
                      <span className="ml-1 text-muted-foreground">({confidence}%)</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("transcript")}
            </p>
            <div className="max-h-36 space-y-3 overflow-y-auto text-sm leading-relaxed text-muted-foreground">
              <div>
                <p className="mb-1 text-xs text-foreground/60">{t("transcriptInitial")}</p>
                <p className="whitespace-pre-wrap">{initialTranscript}</p>
              </div>
              {followUpTranscript ? (
                <div>
                  <p className="mb-1 text-xs text-foreground/60">{t("transcriptFollowUp")}</p>
                  <p className="whitespace-pre-wrap">{followUpTranscript}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
