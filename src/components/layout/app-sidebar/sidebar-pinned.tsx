"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GripVertical, Pin, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarSectionLabel } from "./sidebar-section-label";
import { orderPinnedItems } from "./pinned-config";
import { sidebarInsetClass } from "./sidebar-layout";
import { useSidebarLayout } from "./sidebar-layout-context";
import { useSidebarStore } from "./sidebar-store";

function formatUpdatedAt(
  format: ReturnType<typeof useFormatter>,
  iso: string,
) {
  return format.dateTime(new Date(iso), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SidebarPinned({
  locale,
  collapsedOverride,
}: {
  locale: string;
  collapsedOverride?: boolean;
}) {
  const searchParams = useSearchParams();
  const format = useFormatter();
  const t = useTranslations("sidebar.pinned");
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const pinnedOrder = useSidebarStore((s) => s.pinnedOrder);
  const pinnedOpen = useSidebarStore((s) => s.sectionsOpen.pinned);
  const toggleSection = useSidebarStore((s) => s.toggleSection);
  const reorderPinned = useSidebarStore((s) => s.reorderPinned);
  const collapsed = collapsedOverride ?? collapsedFromStore;
  const { inDrawer } = useSidebarLayout();

  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const items = useMemo(() => orderPinnedItems(pinnedOrder), [pinnedOrder]);

  if (items.length === 0) {
    return null;
  }

  const activeEstimateId = searchParams?.get("estimate");

  return (
    <div
      className={cn(
        sidebarInsetClass(collapsed, inDrawer),
        pinnedOpen || collapsed ? "pb-3" : "pb-0",
      )}
    >
      {!collapsed ? (
        <SidebarSectionLabel
          icon={Pin}
          expanded={pinnedOpen}
          onToggle={() => toggleSection("pinned")}
          toggleLabel={pinnedOpen ? t("collapse") : t("expand")}
          className="pt-1"
          action={
            <button
              type="button"
              aria-label={t("add")}
              className="rounded-md p-0.5 text-[var(--sidebar-section)] transition hover:bg-[var(--sidebar-nav-hover)] hover:text-[var(--sidebar-heading)]"
            >
              <Plus className="size-3.5" strokeWidth={1.75} />
            </button>
          }
        >
          {t("title")}
        </SidebarSectionLabel>
      ) : null}

      {pinnedOpen || collapsed ? (
        <ul className={cn("space-y-0.5", collapsed && "pt-1")}>
          {items.map((item) => {
            const href = item.href(locale);
            const active = activeEstimateId === item.key;

            const updatedLabel = formatUpdatedAt(format, item.updatedAt);

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
              <div
                className={cn(
                  "group flex min-w-0 max-w-full items-center rounded-lg transition-colors",
                  "hover:bg-[var(--sidebar-nav-hover)]",
                  active && "bg-[var(--sidebar-nav-active)]",
                  dragKey === item.key && "opacity-50",
                  overKey === item.key && dragKey && dragKey !== item.key && "ring-1 ring-inset ring-primary/20",
                )}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  setDragKey(item.key);
                }}
                onDragEnd={() => {
                  setDragKey(null);
                  setOverKey(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dragKey && dragKey !== item.key) {
                    setOverKey(item.key);
                  }
                }}
                onDragLeave={() => {
                  if (overKey === item.key) setOverKey(null);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragKey && dragKey !== item.key) {
                    reorderPinned(dragKey, item.key);
                  }
                  setDragKey(null);
                  setOverKey(null);
                }}
              >
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : "false"}
                  className="flex min-w-0 flex-1 items-start gap-2 overflow-hidden rounded-lg px-2 py-2"
                >
                  <item.icon
                    className="mt-0.5 size-3.5 shrink-0 opacity-80"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="sidebar-heading block truncate text-[13px] leading-tight">
                      {item.title}
                    </span>
                    <span className="sidebar-item-description mt-0.5 block truncate text-[11px] leading-tight">
                      {updatedLabel}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label={t("drag")}
                  className={cn(
                    "mr-0.5 flex size-7 shrink-0 cursor-grab items-center justify-center rounded-md",
                    "text-[var(--sidebar-section)] transition-opacity",
                    inDrawer ? "opacity-60" : "opacity-0 group-hover:opacity-100",
                    "active:cursor-grabbing",
                  )}
                  tabIndex={-1}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <GripVertical className="size-3" strokeWidth={1.75} />
                </button>
              </div>
            );

            return (
              <li key={item.key}>
                {collapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>{row}</TooltipTrigger>
                      <TooltipContent side="right">
                        <span className="block font-medium">{item.title}</span>
                        <span className="text-muted-foreground">{updatedLabel}</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
