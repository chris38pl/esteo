"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function NavbarNotificationsButton() {
  const t = useTranslations("navbar.notifications");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("label")}
            className="size-9 shrink-0 rounded-lg border-border/60 bg-card/40 text-muted-foreground shadow-none hover:bg-accent/50 hover:text-foreground"
            disabled
          >
            <Bell className="size-4" strokeWidth={1.75} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t("empty")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
