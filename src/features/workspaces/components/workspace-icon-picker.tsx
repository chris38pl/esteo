"use client";

import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Building2,
  HardHat,
  Heart,
  Home,
  Rocket,
  Store,
  Wrench,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type WorkspaceIconKey =
  | "building"
  | "store"
  | "briefcase"
  | "rocket"
  | "heart"
  | "home"
  | "hardHat"
  | "zap"
  | "wrench";

const ICON_OPTIONS: Array<{ key: WorkspaceIconKey; icon: LucideIcon }> = [
  { key: "building", icon: Building2 },
  { key: "store", icon: Store },
  { key: "briefcase", icon: Briefcase },
  { key: "rocket", icon: Rocket },
  { key: "heart", icon: Heart },
  { key: "home", icon: Home },
  { key: "hardHat", icon: HardHat },
  { key: "zap", icon: Zap },
  { key: "wrench", icon: Wrench },
];

export function WorkspaceIconPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: WorkspaceIconKey;
  onChange: (icon: WorkspaceIconKey) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("workspaces.createForm");

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t("iconLabel")}</p>
      <div className="grid w-full grid-cols-9 gap-2">
        {ICON_OPTIONS.map(({ key, icon: Icon }) => {
          const selected = value === key;

          return (
            <button
              key={key}
              type="button"
              aria-label={t(`icons.${key}`)}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onChange(key)}
              className={cn(
                "flex aspect-square w-full items-center justify-center rounded-full border transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.75} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
