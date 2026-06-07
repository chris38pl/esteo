"use client";

import { useState } from "react";
import { Bot, Plus, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { estimateMobileFabClass } from "@/features/estimates/lib/estimate-layout-config";
import { cn } from "@/lib/utils";

interface EstimateMobileFabProps {
  onAddSection: () => void;
  onAddPosition: () => void;
  onImportPriceList: () => void;
  onAskAi: () => void;
}

export function EstimateMobileFab({
  onAddSection,
  onAddPosition,
  onImportPriceList,
  onAskAi,
}: EstimateMobileFabProps) {
  const t = useTranslations("estimates");
  const [open, setOpen] = useState(false);

  const actions = [
    {
      id: "add-position",
      label: t("editor.addItem"),
      icon: Plus,
      onClick: () => {
        onAddPosition();
        setOpen(false);
      },
      accent: false,
    },
    {
      id: "add-section",
      label: t("editor.addSection"),
      icon: Plus,
      onClick: () => {
        onAddSection();
        setOpen(false);
      },
      accent: false,
    },
    {
      id: "import",
      label: t("editor.toolbar.importPriceList"),
      icon: Upload,
      onClick: () => {
        onImportPriceList();
        setOpen(false);
      },
      accent: false,
      disabled: true,
    },
    {
      id: "ai",
      label: t("editor.mobile.askAi"),
      icon: Bot,
      onClick: () => {
        onAskAi();
        setOpen(false);
      },
      accent: true,
    },
  ] as const;

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/20 backdrop-blur-[1px]"
          aria-label={t("editor.mobile.closeFab")}
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className={cn(estimateMobileFabClass, "fixed z-[60] flex flex-col items-end gap-2")}>
      {open ? (
        <div className="mb-1 flex flex-col items-end gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                disabled={"disabled" in action && action.disabled}
                onClick={action.onClick}
                className={cn(
                  "flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur-sm transition-colors",
                  action.accent
                    ? "border-violet-500/30 bg-violet-600 text-white hover:bg-violet-500"
                    : "border-border/70 bg-card/95 text-foreground hover:bg-muted/80",
                  "disabled" in action && action.disabled && "opacity-50",
                )}
              >
                <span>{action.label}</span>
                <Icon className="size-4 shrink-0" />
              </button>
            );
          })}
        </div>
      ) : null}

      <Button
        type="button"
        size="icon"
        aria-expanded={open}
        aria-label={open ? t("editor.mobile.closeFab") : t("editor.mobile.openFab")}
        className={cn(
          "size-14 rounded-full shadow-lg transition-transform",
          open
            ? "rotate-45 bg-muted text-foreground hover:bg-muted/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
        onClick={() => setOpen((value) => !value)}
      >
        <Plus className="size-6" />
      </Button>
      </div>
    </>
  );
}
