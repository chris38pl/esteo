"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { VoiceIntakeExtraction } from "@/ai/schemas/voice-intake-extraction";
import {
  buildRecognizedElements,
  capRecognizedElements,
} from "@/features/voice-intake/lib/build-recognized-elements";
import type { Locale } from "@/lib/locale";

export function VoiceRecognizedSection({
  extraction,
  cleanedTranscript,
  locale,
  headingKey = "understoodHeading",
}: {
  extraction: VoiceIntakeExtraction;
  cleanedTranscript: string;
  locale: Locale;
  headingKey?: "understoodHeading" | "alreadyUnderstoodHeading";
}) {
  const tReview = useTranslations("voiceIntake.review");
  const tRecording = useTranslations("voiceIntake.recording");

  const elements = buildRecognizedElements(extraction, cleanedTranscript, locale);
  const { visible, overflowCount } = capRecognizedElements(elements);

  if (elements.length === 0) {
    return null;
  }

  const heading =
    headingKey === "alreadyUnderstoodHeading"
      ? tRecording("alreadyUnderstoodHeading")
      : tReview("understoodHeading");

  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold tracking-tight text-foreground">{heading}</h3>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {visible.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm text-foreground/90">
            <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
            <span>{item.label}</span>
          </li>
        ))}
        {overflowCount > 0 && headingKey === "understoodHeading" ? (
          <li className="col-span-full text-sm text-muted-foreground">
            {tReview("recognizedOverflow", { count: overflowCount })}
          </li>
        ) : null}
      </ul>
    </section>
  );
}
