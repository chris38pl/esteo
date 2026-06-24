"use client";

import { useEffect, useState } from "react";
import { Loader2, Minus, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  estimateFlatInputClassName,
  estimateSectionRowClassName,
} from "@/features/estimates/components/estimate-table-input-styles";

interface TemplateSectionRowProps {
  id: string;
  title: string;
  guidance: string;
  sectionNumber: number;
  expanded: boolean;
  advancedMode: boolean;
  onToggleExpanded: () => void;
  onUpdateSection: (id: string, patch: { title?: string; guidance?: string }) => void;
  onDeleteSection: (id: string) => void;
  onAddItem: (sectionId: string) => void;
  isAddingItem?: boolean;
  onBlur: () => void | Promise<void>;
  canDelete: boolean;
}

export function TemplateSectionRow({
  id,
  title,
  guidance,
  sectionNumber,
  expanded,
  advancedMode,
  onToggleExpanded,
  onUpdateSection,
  onDeleteSection,
  onAddItem,
  isAddingItem = false,
  onBlur,
  canDelete,
}: TemplateSectionRowProps) {
  const t = useTranslations("workspaces.configuration.templates.editor");
  const tEst = useTranslations("estimates");
  const [localTitle, setLocalTitle] = useState(title);
  const [localGuidance, setLocalGuidance] = useState(guidance);

  useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  useEffect(() => {
    setLocalGuidance(guidance);
  }, [guidance]);

  return (
    <>
      <tr className={estimateSectionRowClassName} data-template-section-id={id}>
        <td className="w-9 px-2 py-2.5 align-middle">
          <Button
            variant="ghost"
            size="icon-sm"
            className="size-8 rounded-md text-muted-foreground hover:bg-muted/80"
            onClick={onToggleExpanded}
            aria-label={expanded ? tEst("editor.collapseSection") : tEst("editor.expandSection")}
          >
            {expanded ? <Minus className="size-4" /> : <Plus className="size-4" />}
          </Button>
        </td>
        <td className="w-14 px-2 py-2.5 align-middle text-xs font-semibold text-muted-foreground">
          {sectionNumber}
        </td>
        <td colSpan={2} className="px-2 py-2.5 align-middle">
          <Input
            value={localTitle}
            onChange={(event) => {
              setLocalTitle(event.target.value);
              onUpdateSection(id, { title: event.target.value });
            }}
            onBlur={onBlur}
            placeholder={t("sectionTitlePlaceholder")}
            className={`${estimateFlatInputClassName} px-0 font-semibold`}
          />
        </td>
        <td className="w-10 px-2 py-2.5 align-middle">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8 rounded-md text-muted-foreground"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onAddItem(id)}
                disabled={isAddingItem}
                className="gap-2"
              >
                {isAddingItem ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                {isAddingItem ? tEst("editor.addingItem") : tEst("editor.addItem")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDeleteSection(id)}
                disabled={!canDelete}
                className="gap-2 text-destructive"
              >
                <Trash2 className="size-4" />
                {tEst("editor.deleteSection")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
      {expanded && advancedMode ? (
        <tr className="bg-secondary/25 dark:bg-card/80">
          <td />
          <td />
          <td colSpan={3} className="px-2 pb-3 pt-0">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("sectionGuidance")}</p>
            <Textarea
              value={localGuidance}
              onChange={(event) => {
                setLocalGuidance(event.target.value);
                onUpdateSection(id, { guidance: event.target.value });
              }}
              onBlur={onBlur}
              placeholder={t("sectionGuidancePlaceholder")}
              className="min-h-20 resize-y text-sm"
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}
