"use client";

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

export function VoiceMissingFieldsList({ items }: { items: MissingFieldInfo[] }) {
  const t = useTranslations("voiceIntake.recording.followUpFriendly");

  const displayItems = items.filter((item) => item.priority === "key" || item.priority === "contact");

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border/50 bg-muted/20 px-4 py-3.5 text-left">
      <p className="text-sm font-medium text-foreground">{t("heading")}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("subheading")}</p>
      <ul className="mt-3 space-y-2">
        {displayItems.map((item) => {
          const key = FRIENDLY_KEY_MAP[item.fieldKey];
          const prompt = key ? t(key) : item.label;
          return (
            <li
              key={item.fieldKey}
              className="text-sm text-foreground/90 before:mr-2 before:text-muted-foreground before:content-['“'] after:text-muted-foreground after:content-['”']"
            >
              {prompt}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
