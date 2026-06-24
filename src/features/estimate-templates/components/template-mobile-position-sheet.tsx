"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, FileText, Hash, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { estimatePrimaryButtonClassName } from "@/features/estimates/components/estimate-action-button-styles";
import type { TemplateItemDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import type { TemplateAutoSaveStatus } from "@/features/estimate-templates/hooks/use-template-autosave";
import { cn } from "@/lib/utils";

interface TemplateMobilePositionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TemplateItemDraft | null;
  positionLabel: string;
  onPersistItem: (
    itemId: string,
    data: Partial<Pick<TemplateItemDraft, "name" | "unit">>,
  ) => void;
  onDelete: () => void;
  onBlur: () => void | Promise<void>;
  autosaveStatus?: TemplateAutoSaveStatus;
}

const editRowClassName = "flex gap-3 py-2.5 pl-[22px] pr-[22px]";

const fieldInputClassName =
  "estimate-mobile-position-field m-0 h-auto min-h-0 appearance-none border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none outline-none ring-0";

function EditRowIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="estimate-mobile-position-icon flex size-9 shrink-0 items-center justify-center rounded-lg">
      <Icon className="size-4 text-primary dark:text-muted-foreground" aria-hidden />
    </span>
  );
}

function NameEditRow({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={cn(editRowClassName, "items-start")}>
      <EditRowIcon icon={FileText} />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(fieldInputClassName, "mt-0.5 w-full")}
        />
      </div>
    </div>
  );
}

export function TemplateMobilePositionSheet({
  open,
  onOpenChange,
  item,
  positionLabel,
  onPersistItem,
  onDelete,
  onBlur,
  autosaveStatus = "idle",
}: TemplateMobilePositionSheetProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");
  const tEst = useTranslations("estimates");
  const [local, setLocal] = useState<TemplateItemDraft | null>(item);

  useEffect(() => {
    setLocal(item);
  }, [item]);

  if (!local) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="estimate-mobile-position-sheet flex h-[min(92dvh,720px)] flex-col gap-0 rounded-t-2xl p-0"
      >
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-lg"
            onClick={() => onOpenChange(false)}
            aria-label={tEst("editor.mobile.cancel")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <SheetTitle className="min-w-0 flex-1 text-base font-semibold">
            {positionLabel}
          </SheetTitle>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          <NameEditRow
            label={t("columnName")}
            value={local.name}
            placeholder={t("itemNamePlaceholder")}
            onChange={(name) => {
              setLocal((prev) => (prev ? { ...prev, name } : prev));
              onPersistItem(local.id, { name });
            }}
          />
          <div className={cn(editRowClassName, "items-center")}>
            <EditRowIcon icon={Hash} />
            <p className="min-w-0 flex-1 text-sm text-muted-foreground">{t("columnUnit")}</p>
            <input
              value={local.unit}
              onChange={(event) => {
                const unit = event.target.value;
                setLocal((prev) => (prev ? { ...prev, unit } : prev));
                onPersistItem(local.id, { unit });
              }}
              onBlur={onBlur}
              placeholder={t("unitPlaceholder")}
              className={cn(fieldInputClassName, "w-24 text-right")}
            />
          </div>
        </div>

        <SheetFooter className="border-t border-border/60 px-4 py-3 sm:flex-col">
          <Button
            type="button"
            variant="destructive"
            className="w-full"
            onClick={() => {
              onDelete();
              onOpenChange(false);
            }}
          >
            <Trash2 className="size-4" />
            {tEst("editor.deleteItem")}
          </Button>
          <Button
            type="button"
            className={cn("w-full", estimatePrimaryButtonClassName)}
            onClick={() => {
              void onBlur();
              onOpenChange(false);
            }}
          >
            {autosaveStatus === "saving" ? tEst("editor.mobile.saving") : tEst("editor.mobile.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
