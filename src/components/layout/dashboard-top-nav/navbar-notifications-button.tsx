"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/locale";
import { NotificationsPanelContent } from "@/features/notifications/components/notifications-panel-content";
import type { NotificationCounts } from "@/features/notifications/lib/notification-types";

function useMdUp() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(min-width: 768px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => true,
  );
}

export function NavbarNotificationsButton({
  locale,
  initialCounts,
}: {
  locale: Locale;
  initialCounts: NotificationCounts;
}) {
  const tNavbar = useTranslations("navbar.notifications");
  const mdUp = useMdUp();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState(initialCounts);

  useEffect(() => {
    setCounts(initialCounts);
  }, [initialCounts]);

  const badgeCount = counts.unread;
  const badgeLabel = badgeCount > 99 ? "99+" : String(badgeCount);
  const hasActionRequired = counts.actionRequired > 0;

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={tNavbar("label")}
      className={cn(
        "relative size-9 shrink-0 rounded-lg border-border/60 bg-card/40 shadow-none hover:bg-accent/50 hover:text-foreground",
        badgeCount > 0 ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Bell className="size-4" strokeWidth={1.75} />
      {badgeCount > 0 ? (
        <span
          className={cn(
            "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
            hasActionRequired
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground",
          )}
        >
          {badgeLabel}
        </span>
      ) : null}
    </Button>
  );

  const panel = (
    <NotificationsPanelContent
      locale={locale}
      initialCounts={counts}
      onCountsChange={setCounts}
    />
  );

  if (mdUp) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent align="end" className="w-[400px] p-0">
          {open ? panel : null}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent side="bottom" className={cn("h-[85dvh] p-0")}>
        <SheetHeader className="sr-only">
          <SheetTitle>{tNavbar("label")}</SheetTitle>
        </SheetHeader>
        {open ? panel : null}
      </SheetContent>
    </Sheet>
  );
}
