"use client";

import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Locale } from "@/lib/locale";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { SidebarSectionLabel } from "./sidebar-section-label";
import { SidebarUpgrade } from "./sidebar-upgrade";
import { SidebarAccount } from "./sidebar-account";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarSettings({
  locale,
  collapsedOverride,
}: {
  locale: Locale;
  collapsedOverride?: boolean;
}) {
  const t = useTranslations("sidebar");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  return (
    <div
      className={cn(
        sidebarInsetClass(collapsed, inDrawer),
        "pb-3 pt-2",
        collapsed && "flex flex-col items-center gap-2",
      )}
    >
      {!collapsed ? (
        <SidebarSectionLabel icon={Settings2} collapsible={false} className="pt-1">
          {t("settings.title")}
        </SidebarSectionLabel>
      ) : null}

      <div
        className={cn(
          "min-w-0 max-w-full space-y-2",
          collapsed && "flex flex-col items-center space-y-2",
        )}
      >
        <SidebarUpgrade collapsedOverride={collapsedOverride} />
        <SidebarAccount collapsedOverride={collapsedOverride} />

        {!collapsed ? (
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <LocaleSwitcher value={locale} compact />
            <ThemeToggle compact />
          </div>
        ) : null}
      </div>
    </div>
  );
}
