"use client";

import {
  Calendar,
  ContactRound,
  FileText,
  Hammer,
  Home,
  MapPin,
  Ruler,
  type LucideIcon,
} from "lucide-react";
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

const FRIENDLY_ICONS: Record<FriendlyKey, LucideIcon> = {
  propertyType: Home,
  city: MapPin,
  area: Ruler,
  timeline: Calendar,
  scope: Hammer,
  contact: ContactRound,
  description: FileText,
  serviceLocation: MapPin,
};

export function VoiceFollowUpMissingList({
  items,
  industry,
}: {
  items: MissingFieldInfo[];
  industry: WorkspaceIndustry;
}) {
  const t = useTranslations("voiceIntake.recording");
  const tIndustry = useVoiceIndustryTranslations(industry);

  const displayItems = items.filter((item) => item.priority === "key" || item.priority === "contact");

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full space-y-3 pt-1 text-center sm:space-y-5 sm:pt-2">
      <div className="space-y-1.5 sm:space-y-2.5">
        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {t("followUpMissingTitle")}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {t("followUpMissingSubtitle")}
        </p>
      </div>

      <div className="space-y-1.5 pb-1 text-left sm:space-y-2.5">
        <p className="text-center text-[11px] text-muted-foreground sm:text-left sm:text-sm">
          {t("followUpMissingListHeading")}
        </p>
        <ul className="space-y-1.5 sm:space-y-2">
          {displayItems.map((item) => {
            const key = FRIENDLY_KEY_MAP[item.fieldKey];
            const label = key ? tIndustry(`missingFriendly.${key}`) : item.label;
            const Icon = key ? FRIENDLY_ICONS[key] : MapPin;

            return (
              <li
                key={item.fieldKey}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/60 px-2.5 py-2 sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary sm:size-9 sm:rounded-lg">
                  <Icon className="size-3.5 sm:size-4" aria-hidden />
                </span>
                <span className="text-xs font-medium text-foreground sm:text-sm">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
