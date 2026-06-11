"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EstimateAiPanel, type EstimateAiPanelProps } from "./estimate-ai-panel";

type EstimateAiFloatingProps = EstimateAiPanelProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hide the FAB while another overlay is active (e.g. mobile position edit sheet). */
  hideTrigger?: boolean;
  /** Hide the entire floating AI (FAB + panel) while a higher overlay is active (e.g. PDF preview). */
  suppressed?: boolean;
};

export function EstimateAiFloating({
  open,
  onOpenChange,
  hideTrigger = false,
  suppressed = false,
  ...panelProps
}: EstimateAiFloatingProps) {
  const t = useTranslations("estimates");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ui = (
    <div data-estimate-ai-floating className="pointer-events-none">
      {open ? (
        <button
          type="button"
          className="pointer-events-auto fixed inset-0 z-[60] bg-black/25 backdrop-blur-[1px] dark:bg-black/45"
          aria-label={t("editor.closeAi")}
          onClick={() => onOpenChange(false)}
        />
      ) : null}

      {open ? (
        <div
          id="estimate-ai-floating-dialog"
          className="estimate-ai-floating-panel pointer-events-auto fixed bottom-20 right-4 z-[70] flex w-[min(22rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] flex-col"
          role="dialog"
          aria-label={t("editor.aiAssistant")}
        >
          <EstimateAiPanel
            {...panelProps}
            onClose={() => onOpenChange(false)}
            className="estimate-ai-panel--floating max-h-[min(70dvh,calc(100dvh-6rem))] shadow-xl"
          />
        </div>
      ) : null}

      {hideTrigger ? null : (
        <Button
          type="button"
          size="icon"
          aria-expanded={open}
          aria-controls={open ? "estimate-ai-floating-dialog" : undefined}
          aria-label={open ? t("editor.closeAi") : t("editor.aiAssistant")}
          className={cn(
            "pointer-events-auto fixed bottom-4 right-4 z-[70] size-14 rounded-full shadow-lg",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            open && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          onClick={() => onOpenChange(!open)}
        >
          {open ? <X className="size-6" /> : <Bot className="size-6" />}
        </Button>
      )}
    </div>
  );

  if (!mounted || suppressed) return null;
  return createPortal(ui, document.body);
}
