"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspaceContext } from "@/components/layout/app-sidebar/workspace-context";
import { SidebarDivider } from "./sidebar-divider";
import { SidebarSectionLabel } from "./sidebar-section-label";
import { adminNavItems } from "./admin-nav-config";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

export function SidebarAdmin({
  locale,
  collapsedOverride,
}: {
  locale: string;
  collapsedOverride?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const { isPlatformAdmin, issueTrackerEnabled } = useWorkspaceContext();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const adminOpen = useSidebarStore((s) => s.sectionsOpen.admin);
  const toggleSection = useSidebarStore((s) => s.toggleSection);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  if (!isPlatformAdmin) {
    return null;
  }

  return (
    <>
      <SidebarDivider />
      <div
        className={cn(
          sidebarInsetClass(collapsed, inDrawer),
          adminOpen || collapsed ? "pb-3" : "pb-0",
        )}
      >
      {!collapsed ? (
        <SidebarSectionLabel
          icon={Shield}
          expanded={adminOpen}
          onToggle={() => toggleSection("admin")}
          toggleLabel={adminOpen ? t("admin.collapse") : t("admin.expand")}
          className="pt-1"
        >
          {t("admin.title")}
        </SidebarSectionLabel>
      ) : null}

      {adminOpen || collapsed ? (
        <TooltipProvider>
          <ul className={cn("space-y-1", collapsed && "pt-1")}>
            {adminNavItems
              .filter((item) => item.key !== "issues" || issueTrackerEnabled)
              .map((item) => {
              const href = item.href(locale);
              const active = pathname === href;
              const label = t(item.labelKey);

              const row = collapsed ? (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className="sidebar-nav-link mx-auto flex size-8 items-center justify-center rounded-lg transition-colors"
                >
                  <item.icon className="size-3.5" strokeWidth={1.75} />
                </Link>
              ) : (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className={cn(
                    "sidebar-nav-link flex min-w-0 max-w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] leading-tight transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                  )}
                >
                  <item.icon className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                </Link>
              );

              return (
                <li key={item.key}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{row}</TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        </TooltipProvider>
      ) : null}
      </div>
      <SidebarDivider />
    </>
  );
}
