"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export function SidebarSectionLabel({
  children,
  icon: Icon,
  action,
  className,
  collapsible = true,
  expanded = true,
  onToggle,
  toggleLabel,
}: {
  children: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  toggleLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        expanded
          ? "pb-2.5 pt-4 first:pt-2"
          : "pb-0 pt-2.5 first:pt-1.5",
        className,
      )}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={toggleLabel}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-md",
            "text-[var(--sidebar-section)] transition hover:bg-[var(--sidebar-nav-hover)]",
            "hover:text-[var(--sidebar-heading)]",
          )}
        >
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-200",
              !expanded && "-rotate-90",
            )}
            strokeWidth={2}
            aria-hidden
          />
        </button>
      ) : null}
      {Icon ? (
        <Icon
          className="size-3.5 shrink-0 text-[var(--sidebar-section)]"
          strokeWidth={1.75}
          aria-hidden
        />
      ) : null}
      <p className="sidebar-section-label min-w-0 flex-1 text-[11px] font-medium leading-none">
        {children}
      </p>
      {action}
    </div>
  );
}
