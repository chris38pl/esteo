"use client";

import type { Locale } from "@/lib/locale";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
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
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  return (
    <div
      className={cn(
        sidebarInsetClass(collapsed, inDrawer),
        "pb-3 pt-3",
        collapsed && "flex flex-col items-center gap-2",
      )}
    >
      <div
        className={cn(
          "min-w-0 max-w-full",
          collapsed ? "flex flex-col items-center gap-2" : "flex flex-col gap-4",
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
