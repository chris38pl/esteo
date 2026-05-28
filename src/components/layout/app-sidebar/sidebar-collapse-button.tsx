"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "./sidebar-store";

export function SidebarCollapseButton({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations("sidebar");
  const prefersReducedMotion = useReducedMotion();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);

  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const label = collapsed ? t("tooltips.expand") : t("tooltips.collapse");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className={cn(
        "group inline-flex size-8 items-center justify-center rounded-md",
        "text-muted-foreground transition hover:text-foreground focus-visible:outline-none cursor-pointer",
        className,
      )}
    >
      <motion.span
        initial={false}
        animate={
          prefersReducedMotion
            ? { rotate: 0 }
            : { rotate: collapsed ? 0 : 0 }
        }
        transition={{ duration: 0.2 }}
        className="flex"
      >
        <Icon className="size-3.5" strokeWidth={1.75} />
      </motion.span>
    </button>
  );
}

