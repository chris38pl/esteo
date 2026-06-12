"use client";

import {
  Calendar,
  ContactRound,
  Hammer,
  Home,
  MapPin,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import type { MissingFieldInfo } from "@/features/voice-intake/types";

type FriendlyKey = "propertyType" | "city" | "area" | "timeline" | "scope" | "contact";

const FRIENDLY_KEY_MAP: Record<string, FriendlyKey> = {
  propertyType: "propertyType",
  city: "city",
  area: "area",
  preferredStartDate: "timeline",
  scopeOfWork: "scope",
  contact: "contact",
};

const FRIENDLY_ICONS: Record<FriendlyKey, LucideIcon> = {
  propertyType: Home,
  city: MapPin,
  area: Ruler,
  timeline: Calendar,
  scope: Hammer,
  contact: ContactRound,
};

export function VoiceFollowUpMissingList({ items }: { items: MissingFieldInfo[] }) {
  const t = useTranslations("voiceIntake.recording");
  const tMissing = useTranslations("voiceIntake.review.missingFriendly");

  const displayItems = items.filter((item) => item.priority === "key" || item.priority === "contact");

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <section className="w-full space-y-5 pt-2 text-center">
      <div className="space-y-2.5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {t("followUpMissingTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">{t("followUpMissingSubtitle")}</p>
      </div>

      <div className="space-y-2.5 pb-1 text-left">
        <p className="text-sm text-muted-foreground">{t("followUpMissingListHeading")}</p>
        <ul className="space-y-2">
          {displayItems.map((item) => {
            const key = FRIENDLY_KEY_MAP[item.fieldKey];
            const label = key ? tMissing(key) : item.label;
            const Icon = key ? FRIENDLY_ICONS[key] : MapPin;

            return (
              <li
                key={item.fieldKey}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/60 px-4 py-3"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
