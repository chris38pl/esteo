"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { navItems } from "./nav-config";
import { useSidebarStore } from "./sidebar-store";

export function SidebarNav({
  locale,
  collapsedOverride,
}: {
  locale: string;
  collapsedOverride?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const prefersReducedMotion = useReducedMotion();
  const collapsedFromStore = useSidebarStore((s) => s.collapsed);
  const collapsed = collapsedOverride ?? collapsedFromStore;

  return (
    <TooltipProvider>
      <nav aria-label="Primary" className="px-2 pt-4"> {/* i18n-ignore-line */}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const href = item.href(locale);
            const active = pathname === href;
            const label = t(item.labelKey);
            const disabled = item.badge === "Soon";

            const row = collapsed ? (
              <Link
                href={disabled ? "#" : href}
                aria-current={active ? "page" : undefined}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : 0}
                className={cn(
                  "group relative mx-auto flex size-12 items-center justify-center rounded-2xl",
                  "transition-colors",
                  disabled && "pointer-events-none opacity-60",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/35 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                )}
              >
                <item.icon className="size-5" />
              </Link>
            ) : (
              <Link
                href={disabled ? "#" : href}
                aria-current={active ? "page" : undefined}
                aria-disabled={disabled || undefined}
                tabIndex={disabled ? -1 : 0}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                  "transition-colors",
                  disabled && "pointer-events-none opacity-60",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/35 hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg",
                    active
                      ? "bg-background/6 text-foreground"
                      : "bg-transparent text-inherit",
                  )}
                >
                  <item.icon className="size-4" />
                </span>

                <motion.span
                  initial={false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                  }
                  className={cn("min-w-0 flex-1 truncate")}
                >
                  {label}
                </motion.span>

                {item.badge ? (
                  <span className="rounded-full border border-border/60 bg-card/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.badge}
                  </span>
                ) : null}
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
      </nav>
    </TooltipProvider>
  );
}

