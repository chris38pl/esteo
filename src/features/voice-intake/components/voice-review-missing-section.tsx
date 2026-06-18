"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

import { useVoiceIndustryTranslations } from "@/features/voice-intake/hooks/use-voice-industry-translations";
import type { MissingFieldInfo } from "@/features/voice-intake/types";
import type { WorkspaceIndustry } from "@prisma/client";

type FriendlyKey =
  | "propertyType"
  | "city"
  | "area"
  | "timeline"
  | "scope"
  | "contact"
  | "description"
  | "serviceLocation";

const FRIENDLY_KEY_MAP: Record<string, FriendlyKey> = {
  propertyType: "propertyType",
  city: "city",
  area: "area",
  preferredStartDate: "timeline",
  scopeOfWork: "scope",
  contact: "contact",
  description: "description",
  serviceLocation: "serviceLocation",
};

export function VoiceReviewMissingSection({
  items,
  industry,
}: {
  items: MissingFieldInfo[];
  industry: WorkspaceIndustry;
}) {
  const t = useTranslations("voiceIntake.review");
  const tIndustry = useVoiceIndustryTranslations(industry);

  const displayItems = items.filter((item) => item.priority === "key" || item.priority === "contact");

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
      <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" aria-hidden />
        {t("stillMissingHeading")}
      </h4>
      <ul className="space-y-1.5 pl-6">
        {displayItems.map((item) => {
          const key = FRIENDLY_KEY_MAP[item.fieldKey];
          const prompt = key ? tIndustry(`missingFriendly.${key}`) : item.label;
          return (
            <li key={item.fieldKey} className="text-sm text-foreground/90">
              {prompt}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
