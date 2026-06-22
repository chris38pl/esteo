"use client";

import type { WorkspaceAppearanceTheme } from "@prisma/client";
import { useTranslations } from "next-intl";

import {
  WORKSPACE_APPEARANCE_THEMES,
  getAppearanceConfig,
} from "@/features/workspaces/lib/workspace-appearance";
import { cn } from "@/lib/utils";

export function WorkspaceThemePicker({
  value,
  onChange,
  disabled = false,
  size = "md",
  variant = "default",
  className,
  onClickCapture,
}: {
  value: WorkspaceAppearanceTheme;
  onChange: (theme: WorkspaceAppearanceTheme) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "header";
  className?: string;
  onClickCapture?: (event: React.MouseEvent) => void;
}) {
  const t = useTranslations("workspaces.appearance");

  const dotSize =
    variant === "header" ? "size-5" : size === "sm" ? "size-2.5" : "size-3";

  return (
    <div
      role="radiogroup"
      aria-label={t("pickerLabel")}
      className={cn(
        "flex items-center",
        variant === "header" ? "gap-2.5" : "gap-2",
        className,
      )}
      onClickCapture={onClickCapture}
    >
      {WORKSPACE_APPEARANCE_THEMES.map((theme) => {
        const config = getAppearanceConfig(theme);
        const selected = value === theme;

        return (
          <button
            key={theme}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`themes.${theme}`)}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onChange(theme);
            }}
            className={cn(
              "rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer",
              dotSize,
              variant === "header"
                ? selected
                  ? ""
                  : "opacity-50 hover:opacity-70"
                : cn(
                    "ring-2 ring-offset-2 ring-offset-card",
                    selected ? "scale-110" : "opacity-70 hover:opacity-100",
                  ),
              disabled && "pointer-events-none opacity-40",
            )}
            style={{
              backgroundColor: config.dotColor,
              ...(variant === "header"
                ? selected
                  ? {
                      boxShadow: `0 0 0 1px ${config.accentMuted}`,
                      outline: `1.5px solid ${config.accent}`,
                      outlineOffset: "2px",
                    }
                  : {}
                : {
                    boxShadow: selected ? `0 0 0 2px ${config.accentMuted}` : undefined,
                    ...(selected
                      ? { outline: `2px solid ${config.accent}`, outlineOffset: "2px" }
                      : {}),
                  }),
            }}
          />
        );
      })}
    </div>
  );
}
