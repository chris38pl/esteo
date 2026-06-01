"use client";

import type { WorkspaceIndustry } from "@prisma/client";
import { ChevronDown, ChevronUp, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WorkspaceEstimateSectionEditorDialog } from "@/features/workspaces/components/workspace-estimate-section-editor-dialog";
import {
  createCustomSectionKey,
  industryDefaultsToWorkspaceSections,
  parseEstimateSectionsFromBranding,
  resolveEstimateSectionRule,
  resolveEstimateSectionTitle,
} from "@/features/workspaces/lib/resolve-estimate-sections";
import { WORKSPACE_ESTIMATE_SECTIONS_MAX_COUNT } from "@/features/workspaces/lib/workspace-section-limits";
import type { WorkspaceBranding } from "@/features/workspaces/schemas/branding";
import type { WorkspaceEstimateSection } from "@/features/workspaces/schemas/estimate-sections";
import {
  resetWorkspaceEstimateSectionsAction,
  updateWorkspaceEstimateSectionsAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function applyLocaleFields(
  section: WorkspaceEstimateSection,
  locale: Locale,
  title: string,
  rule: string,
): WorkspaceEstimateSection {
  if (locale === "en") {
    return {
      ...section,
      titleEn: title,
      ruleEn: rule || undefined,
    };
  }

  return {
    ...section,
    titlePl: title,
    rulePl: rule || undefined,
  };
}

function reorderSections(
  sections: WorkspaceEstimateSection[],
  fromIndex: number,
  toIndex: number,
): WorkspaceEstimateSection[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return sections;
  }

  const next = [...sections];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return sections;
  }
  next.splice(toIndex, 0, moved);
  return next;
}

export function WorkspaceEstimateSectionsPanel({
  workspaceId,
  industry,
  initialBranding,
  locale,
}: {
  workspaceId: string;
  industry: WorkspaceIndustry;
  initialBranding: WorkspaceBranding | null;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.settings.rules.sections");
  const tIndustries = useTranslations("workspaces.industries");
  const router = useRouter();
  const [sections, setSections] = useState<WorkspaceEstimateSection[]>(() => {
    const persisted = parseEstimateSectionsFromBranding(initialBranding);
    return persisted ?? industryDefaultsToWorkspaceSections(industry);
  });
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const persisted = parseEstimateSectionsFromBranding(initialBranding);
    setSections(persisted ?? industryDefaultsToWorkspaceSections(industry));
  }, [initialBranding, industry]);

  const defaultSectionKeys = useMemo(
    () =>
      new Set(
        industryDefaultsToWorkspaceSections(industry).map((section) => section.key),
      ),
    [industry],
  );

  const displayRows = useMemo(
    () =>
      sections.map((section, index) => ({
        index,
        key: section.key,
        title: resolveEstimateSectionTitle(section, locale),
        rule: resolveEstimateSectionRule(section, locale),
        active: section.active,
        isCustom: !defaultSectionKeys.has(section.key),
      })),
    [sections, locale, defaultSectionKeys],
  );

  const canAdd = sections.length < WORKSPACE_ESTIMATE_SECTIONS_MAX_COUNT;
  const canRemove = sections.length > 1;

  function saveSections(nextSections: WorkspaceEstimateSection[]) {
    setError(null);
    startTransition(async () => {
      const result = await updateWorkspaceEstimateSectionsAction(
        workspaceId,
        nextSections,
        locale,
      );

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  function handleSave() {
    saveSections(sections);
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetWorkspaceEstimateSectionsAction(workspaceId, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSections(industryDefaultsToWorkspaceSections(industry));
      router.refresh();
    });
  }

  function openCreate() {
    setDialogMode("create");
    setEditingIndex(null);
    setDialogOpen(true);
  }

  function openEdit(index: number) {
    setDialogMode("edit");
    setEditingIndex(index);
    setDialogOpen(true);
  }

  function handleDialogSubmit(title: string, rule: string) {
    if (dialogMode === "create") {
      const newSection: WorkspaceEstimateSection = {
        key: createCustomSectionKey(),
        titlePl: title,
        titleEn: title,
        rulePl: rule || undefined,
        ruleEn: rule || undefined,
        active: true,
      };

      const next = [...sections, newSection];
      setSections(next);
      setDialogOpen(false);
      saveSections(next);
      return;
    }

    if (editingIndex === null) {
      return;
    }

    const next = sections.map((section, index) =>
      index === editingIndex ? applyLocaleFields(section, locale, title, rule) : section,
    );
    setSections(next);
    setDialogOpen(false);
    setEditingIndex(null);
    saveSections(next);
  }

  function handleToggleActive(index: number, active: boolean) {
    const next = sections.map((section, i) =>
      i === index ? { ...section, active } : section,
    );
    setSections(next);
    saveSections(next);
  }

  function handleDelete(index: number) {
    if (!canRemove) {
      return;
    }

    const next = sections.filter((_, i) => i !== index);
    setSections(next);
    saveSections(next);
  }

  function handleReorder(fromIndex: number, toIndex: number) {
    const next = reorderSections(sections, fromIndex, toIndex);
    setSections(next);
    setDraggedIndex(null);
    setDragOverIndex(null);
    saveSections(next);
  }

  function handleMoveUp(index: number) {
    if (index <= 0) {
      return;
    }
    handleReorder(index, index - 1);
  }

  function handleMoveDown(index: number) {
    if (index >= sections.length - 1) {
      return;
    }
    handleReorder(index, index + 1);
  }

  const editingSection = editingIndex !== null ? sections[editingIndex] : null;

  return (
    <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm dark:shadow-none md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("description", { industry: tIndustries(industry) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isPending}
            onClick={handleReset}
          >
            {t("resetDefaults")}
          </Button>
          <Button
            type="button"
            className="rounded-full bg-violet-600 px-5 text-white hover:bg-violet-700 dark:bg-primary dark:hover:bg-primary/90"
            disabled={isPending || !canAdd}
            onClick={openCreate}
          >
            {t("addSection")}
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/50 [&_[data-slot=table-container]]:overflow-x-visible">
        <TooltipProvider delayDuration={300}>
        <Table className="table-fixed">
          <colgroup>
            <col className="w-9" />
            <col className="w-9" />
            <col className="w-[22%]" />
            <col />
            <col className="w-14" />
            <col className="w-[5.5rem]" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="w-9 px-1" aria-hidden />
              <TableHead className="w-9 px-2">{t("table.order")}</TableHead>
              <TableHead className="whitespace-normal px-2">{t("table.section")}</TableHead>
              <TableHead className="whitespace-normal px-2">{t("table.rule")}</TableHead>
              <TableHead className="px-1 text-center">{t("table.active")}</TableHead>
              <TableHead className="w-[5.5rem] px-1" aria-hidden />
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.map((row) => (
              <TableRow
                key={row.key}
                className={cn(
                  draggedIndex === row.index && "opacity-50",
                  dragOverIndex === row.index && "bg-muted/40",
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (draggedIndex !== null && draggedIndex !== row.index) {
                    setDragOverIndex(row.index);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverIndex === row.index) {
                    setDragOverIndex(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggedIndex !== null) {
                    handleReorder(draggedIndex, row.index);
                  }
                }}
              >
                <TableCell className="align-top px-1 py-3 whitespace-normal">
                  <button
                    type="button"
                    draggable={!isPending}
                    disabled={isPending}
                    className="hidden size-8 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50 md:flex"
                    aria-label={t("dragHandle")}
                    onDragStart={() => setDraggedIndex(row.index)}
                    onDragEnd={() => {
                      setDraggedIndex(null);
                      setDragOverIndex(null);
                    }}
                  >
                    <GripVertical className="size-4 shrink-0" />
                  </button>
                  <div className="flex flex-col gap-0.5 md:hidden">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={isPending || row.index === 0}
                      onClick={() => handleMoveUp(row.index)}
                      aria-label={t("moveUp")}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={isPending || row.index === sections.length - 1}
                      onClick={() => handleMoveDown(row.index)}
                      aria-label={t("moveDown")}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="align-top px-2 py-3 tabular-nums whitespace-normal text-muted-foreground">
                  {row.index + 1}
                </TableCell>
                <TableCell className="align-top px-2 py-3 whitespace-normal">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium leading-snug">{row.title}</span>
                    {row.isCustom ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {t("customBadge")}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="max-w-0 align-top px-2 py-3 whitespace-normal">
                  <p className="min-h-[2.75rem] text-sm leading-relaxed break-words text-muted-foreground">
                    {row.rule || "—"}
                  </p>
                </TableCell>
                <TableCell className="align-top px-1 py-3 text-center whitespace-normal">
                  <Switch
                    checked={row.active}
                    disabled={isPending}
                    onCheckedChange={(checked) => handleToggleActive(row.index, checked)}
                    aria-label={t("table.active")}
                  />
                </TableCell>
                <TableCell className="align-top px-1 py-3 whitespace-normal">
                  <div className="flex items-center justify-end gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={isPending}
                          onClick={() => openEdit(row.index)}
                          aria-label={t("edit")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{t("edit")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          disabled={isPending || !canRemove}
                          onClick={() => handleDelete(row.index)}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{t("delete")}</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TooltipProvider>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t("sectionsLimitFooter", {
          count: sections.length,
          max: WORKSPACE_ESTIMATE_SECTIONS_MAX_COUNT,
        })}
      </p>

      <div className="mt-4 flex justify-end">
        <Button
          type="button"
          className="rounded-full bg-violet-600 px-6 text-white hover:bg-violet-700 dark:bg-primary dark:hover:bg-primary/90"
          disabled={isPending}
          onClick={handleSave}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <WorkspaceEstimateSectionEditorDialog
        open={dialogOpen}
        mode={dialogMode}
        initialTitle={
          editingSection ? resolveEstimateSectionTitle(editingSection, locale) : ""
        }
        initialRule={
          editingSection ? resolveEstimateSectionRule(editingSection, locale) : ""
        }
        isPending={isPending}
        onOpenChange={setDialogOpen}
        onSubmit={handleDialogSubmit}
      />
    </section>
  );
}
