"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { estimateOutlineButtonClassName, estimatePrimaryButtonClassName } from "./estimate-action-button-styles";
import type { SectionData } from "./estimate-items-table";

interface EstimateMobileSectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "rename" | "pick";
  section?: SectionData | null;
  sections?: SectionData[];
  onRename?: (sectionId: string, title: string) => void;
  onPickSection?: (sectionId: string) => void;
  onBlur?: () => void;
}

export function EstimateMobileSectionSheet({
  open,
  onOpenChange,
  mode,
  section,
  sections = [],
  onRename,
  onPickSection,
  onBlur,
}: EstimateMobileSectionSheetProps) {
  const t = useTranslations("estimates");
  const [title, setTitle] = useState(section?.title ?? "");

  useEffect(() => {
    if (open && section) {
      setTitle(section.title);
    }
  }, [open, section]);

  const handleRenameSave = () => {
    if (!section || !onRename) return;
    onRename(section.id, title);
    onBlur?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0" showCloseButton>
        <SheetHeader className="border-b border-border/60 pb-4">
          <SheetTitle>
            {mode === "rename"
              ? t("editor.mobile.renameSection")
              : t("editor.mobile.selectSection")}
          </SheetTitle>
        </SheetHeader>

        {mode === "rename" ? (
          <>
            <div className="px-5 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("editor.mobile.sectionName")}
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10"
                  autoFocus
                />
              </div>
            </div>
            <SheetFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                variant="outline"
                className={estimateOutlineButtonClassName}
                onClick={() => onOpenChange(false)}
              >
                {t("editor.mobile.cancel")}
              </Button>
              <Button
                type="button"
                className={estimatePrimaryButtonClassName}
                onClick={handleRenameSave}
              >
                {t("editor.mobile.save")}
              </Button>
            </SheetFooter>
          </>
        ) : (
          <div className="max-h-[50dvh] overflow-y-auto px-3 py-3">
            <ul className="space-y-2">
              {sections.map((s, index) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-card/80 px-4 py-3 text-left text-sm font-medium transition-colors active:bg-muted/30"
                    onClick={() => {
                      onPickSection?.(s.id);
                      onOpenChange(false);
                    }}
                  >
                    <span className="truncate">
                      {index + 1}. {s.title || t("editor.newSection")}
                    </span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {t("editor.itemCount", { count: s.items.length })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
