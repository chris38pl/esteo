"use client";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "./sidebar-store";

export function SidebarDivider({ className }: { className?: string }) {
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <div
      role="separator"
      aria-hidden
      className={cn(
        "sidebar-divider my-2 h-px shrink-0",
        collapsed ? "mx-1.5" : "mx-3",
        className,
      )}
    />
  );
}
