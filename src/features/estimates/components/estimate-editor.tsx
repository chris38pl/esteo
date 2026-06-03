"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEstimateAutosave } from "@/features/estimates/hooks/use-estimate-autosave";
import type {
  EstimateForEditorClient,
  VersionTreeClient,
} from "@/features/estimates/lib/serialize-estimate";
import {
  addLineItemAction,
  addSectionAction,
  deleteLineItemAction,
  deleteSectionAction,
} from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";
import type { LineItemData } from "./estimate-line-item-row";
import type { SectionData } from "./estimate-items-table";
import { EstimateHeader } from "./estimate-header";
import { EstimateContextCards } from "./estimate-context-cards";
import { EstimateItemsTable } from "./estimate-items-table";
import { EstimateRightRail } from "./estimate-right-rail";
import { EstimateAiPanel } from "./estimate-ai-panel";
import { EstimateGeneratingSkeleton } from "./estimate-generating-skeleton";
import type { LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";

interface EstimateEditorProps {
  estimate: EstimateForEditorClient;
  versionTree: VersionTreeClient | null;
  activeVersionId: string | null;
  workspaceSlug: string;
  locale: Locale;
  rulesApplied?: boolean;
}

function versionTreeToSections(tree: VersionTreeClient | null): SectionData[] {
  if (!tree) return [];
  return tree.sections.map((s) => ({
    id: s.id,
    title: s.title,
    sortOrder: s.sortOrder,
    items: s.lineItems.map((li) => ({
      id: li.id,
      name: li.name,
      unit: li.unit,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      vatRate: li.vatRate,
      sortOrder: li.sortOrder,
    })),
  }));
}

export function EstimateEditor({
  estimate,
  versionTree,
  activeVersionId,
  workspaceSlug,
  locale,
  rulesApplied = false,
}: EstimateEditorProps) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [sections, setSections] = useState<SectionData[]>(() =>
    versionTreeToSections(versionTree),
  );
  const [marginPercent, setMarginPercent] = useState<number>(versionTree?.marginPercent ?? 0);
  const [versionUpdatedAt, setVersionUpdatedAt] = useState(
    versionTree?.updatedAt ?? new Date().toISOString(),
  );
  const [showAiPanel, setShowAiPanel] = useState(false);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;

  const requestStatus = estimate.estimateRequest?.status ?? null;
  const isGenerating =
    requestStatus === "PENDING" || requestStatus === "PROCESSING";

  const activeVersion = versionTree;
  const allVersions = estimate.versions.map((v) => ({
    id: v.id,
    versionNumber: v.versionNumber,
    status: v.status,
  }));

  const { status: autosaveStatus, save, onBlur: autosaveOnBlur } = useEstimateAutosave({
    versionId: activeVersionId ?? "",
    workspaceId: estimate.workspaceId,
    initialUpdatedAt: versionUpdatedAt,
    locale,
  });

  const applyVersionTree = useCallback((tree: VersionTreeClient | null) => {
    setSections(versionTreeToSections(tree));
    setMarginPercent(tree?.marginPercent ?? 0);
    if (tree?.updatedAt) {
      setVersionUpdatedAt(tree.updatedAt);
    }
  }, []);

  const handleAiMutation = useCallback(
    (result: { updatedAt: string; versionTree: VersionTreeClient | null }) => {
      if (result.versionTree) {
        applyVersionTree(result.versionTree);
      } else if (result.updatedAt) {
        setVersionUpdatedAt(result.updatedAt);
      }
      router.refresh();
    },
    [applyVersionTree, router],
  );

  const triggerSave = useCallback(() => {
    if (!activeVersionId) return;
    save({ marginPercent });
  }, [activeVersionId, save, marginPercent]);

  const triggerBlurSave = useCallback(() => {
    if (!activeVersionId) return;
    autosaveOnBlur({ marginPercent });
  }, [activeVersionId, autosaveOnBlur, marginPercent]);

  useEffect(() => {
    applyVersionTree(versionTree);
  }, [versionTree?.id, versionTree?.updatedAt, applyVersionTree]);

  const handleAddSection = async () => {
    if (!activeVersionId) return;
    const result = await addSectionAction({
      versionId: activeVersionId,
      workspaceId: estimate.workspaceId,
      locale,
    });
    if (result.success) {
      setSections((prev) => [
        ...prev,
        {
          id: result.data.sectionId,
          title: t("editor.newSection"),
          sortOrder: prev.length,
          items: [],
        },
      ]);
    }
  };

  const handleUpdateSection = (sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    );
    triggerSave();
  };

  const handleDeleteSection = async (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    await deleteSectionAction({ sectionId, locale });
  };

  const handleAddItem = async (sectionId: string) => {
    if (!activeVersionId) return;
    const result = await addLineItemAction({
      sectionId,
      workspaceId: estimate.workspaceId,
      locale,
    });
    if (result.success) {
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                items: [
                  ...s.items,
                  {
                    id: result.data.itemId,
                    name: "",
                    unit: null,
                    quantity: 0,
                    unitPrice: 0,
                    vatRate: 0.23,
                    sortOrder: s.items.length,
                  },
                ],
              }
            : s,
        ),
      );
    }
  };

  const handleUpdateItem = (
    itemId: string,
    data: Partial<Omit<LineItemData, "id" | "sortOrder">>,
  ) => {
    setSections((prev) =>
      prev.map((s) => ({
        ...s,
        items: s.items.map((li) => (li.id === itemId ? { ...li, ...data } : li)),
      })),
    );
    triggerSave();
  };

  const handleDeleteItem = async (itemId: string) => {
    setSections((prev) =>
      prev.map((s) => ({ ...s, items: s.items.filter((li) => li.id !== itemId) })),
    );
    await deleteLineItemAction({ itemId, locale });
  };

  const allItems: LineItemCalcInput[] = sections.flatMap((s) =>
    s.items.map((li) => ({
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      vatRate: li.vatRate,
    })),
  );

  const customerData = estimate.estimateRequest?.customerData as
    | { fullName?: string; email?: string }
    | null
    | undefined;

  return (
    <div className="space-y-4">
      {autosaveStatus === "conflict" && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
          {t("editor.conflictBanner")}{" "}
          <button
            className="underline underline-offset-4"
            onClick={() => router.refresh()}
          >
            {t("editor.reload")}
          </button>
        </div>
      )}

      <EstimateHeader
        title={estimate.title}
        estimateId={estimate.id}
        workspaceId={estimate.workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
        versions={allVersions}
        activeVersionId={activeVersionId ?? ""}
        autosaveStatus={autosaveStatus}
        rulesApplied={rulesApplied}
      />

      <EstimateContextCards
        requestNumber={estimate.estimateRequest?.requestNumber}
        requestStatus={estimate.estimateRequest?.status}
        customerName={customerData?.fullName}
        customerEmail={customerData?.email}
        createdAt={estimate.createdAt}
        updatedAt={activeVersion?.updatedAt ?? null}
      />

      {isGenerating ? (
        <EstimateGeneratingSkeleton
          estimateId={estimate.id}
          workspaceSlug={workspaceSlug}
          locale={locale}
          initialStatus={requestStatus}
        />
      ) : (
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                {t("editor.items")}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => setShowAiPanel((v) => !v)}
              >
                <Bot className="size-4" />
                {showAiPanel ? t("editor.hideAi") : t("editor.aiAssistant")}
              </Button>
            </div>

            <EstimateItemsTable
              sections={sections}
              currency={estimate.currency}
              onAddSection={handleAddSection}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              onBlur={triggerBlurSave}
            />
          </div>

          <div className="w-56 shrink-0 space-y-4">
            <EstimateRightRail
              items={allItems}
              marginPercent={marginPercent}
              currency={estimate.currency}
              onMarginChange={(v) => {
                setMarginPercent(v);
                triggerSave();
              }}
              onMarginBlur={(v) => {
                setMarginPercent(v);
                triggerBlurSave();
              }}
            />

            {showAiPanel && activeVersionId && (
              <>
                <Separator />
                <EstimateAiPanel
                  versionId={activeVersionId}
                  workspaceId={estimate.workspaceId}
                  workspaceSlug={workspaceSlug}
                  estimateId={estimate.id}
                  locale={locale}
                  maxUndoSteps={3}
                  onApproved={handleAiMutation}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
