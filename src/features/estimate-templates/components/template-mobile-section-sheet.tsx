"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { estimatePrimaryButtonClassName } from "@/features/estimates/components/estimate-action-button-styles";
import type { TemplateSectionDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import { cn } from "@/lib/utils";

interface TemplateMobileSectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: TemplateSectionDraft | null;
  advancedMode: boolean;
  onUpdateSection: (
    sectionId: string,
    patch: { title?: string; guidance?: string },
  ) => void;
  onBlur: () => void | Promise<void>;
}

export function TemplateMobileSectionSheet({
  open,
  onOpenChange,
  section,
  advancedMode,
  onUpdateSection,
  onBlur,
}: TemplateMobileSectionSheetProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");
  const tEst = useTranslations("estimates");
  const [title, setTitle] = useState("");
  const [guidance, setGuidance] = useState("");

  useEffect(() => {
    if (!section) return;
    setTitle(section.title);
    setGuidance(section.guidance);
  }, [section]);

  if (!section) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetTitle>{tEst("editor.mobile.renameSection")}</SheetTitle>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("sectionTitlePlaceholder")}</label>
            <Input
              value={title}
              onChange={(event) => {
                const next = event.target.value;
                setTitle(next);
                onUpdateSection(section.id, { title: next });
              }}
              onBlur={onBlur}
            />
          </div>
          {advancedMode ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("sectionGuidance")}</label>
              <Textarea
                value={guidance}
                onChange={(event) => {
                  const next = event.target.value;
                  setGuidance(next);
                  onUpdateSection(section.id, { guidance: next });
                }}
                onBlur={onBlur}
                placeholder={t("sectionGuidancePlaceholder")}
                className="min-h-24"
              />
            </div>
          ) : null}
        </div>
        <SheetFooter className="mt-4">
          <Button
            type="button"
            className={cn("w-full", estimatePrimaryButtonClassName)}
            onClick={() => {
              void onBlur();
              onOpenChange(false);
            }}
          >
            {tEst("editor.mobile.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
