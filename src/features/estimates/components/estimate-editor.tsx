"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEstimateAutosave } from "@/features/estimates/hooks/use-estimate-autosave";
import { useEstimateAdvancedMode } from "@/features/estimates/hooks/use-estimate-advanced-mode";
import type {
  EstimateForEditorClient,
  VersionTreeClient,
} from "@/features/estimates/lib/serialize-estimate";
import {
  addLineItemAction,
  addSectionAction,
  deleteLineItemAction,
  deleteSectionAction,
  reorderAction,
} from "@/features/estimates/server/actions";
import type { Locale } from "@/lib/locale";
import type { LineItemData } from "./estimate-line-item-row";
import type { SectionData } from "./estimate-items-table";
import { EstimateHeader } from "./estimate-header";
import { EstimateContextCards } from "./estimate-context-cards";
import { EstimateItemsTable } from "./estimate-items-table";
import { EstimateRightRail } from "./estimate-right-rail";
import { EstimateAiPanel } from "./estimate-ai-panel";
import { EstimateAiFloating } from "./estimate-ai-floating";
import {
  ESTIMATE_LAYOUT_CONFIG,
  estimateEditorAiSideGridClass,
  estimateEditorMaxWidthClass,
  mediaQueryMin,
} from "@/features/estimates/lib/estimate-layout-config";
import { useEstimateAiSideLayout } from "@/features/estimates/hooks/use-estimate-ai-side-layout";
import { EstimateEditorLayoutStyles } from "./estimate-editor-layout-styles";
import { EstimateGeneratingSkeleton } from "./estimate-generating-skeleton";
import {
  EstimateEditorTabs,
  type EstimateEditorTabId,
} from "./estimate-editor-tabs";
import { EstimateItemsToolbar } from "./estimate-items-toolbar";
import type { LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
import {
  baseUnitPriceFromUnitPrice,
  unitPriceFromBase,
} from "@/features/estimates/lib/margin-pricing";
import type {
  AiMessageClient,
} from "@/features/estimates/lib/serialize-ai-messages";
import type { ProposeEditResult } from "@/features/estimates/lib/estimate-agent-types";
import { cn } from "@/lib/utils";
import "@/features/estimates/styles/estimate-editor-layout.css";

interface EstimateEditorProps {
  estimate: EstimateForEditorClient;
  versionTree: VersionTreeClient | null;
  activeVersionId: string | null;
  workspaceSlug: string;
  locale: Locale;
  rulesApplied?: boolean;
  investmentPropertyType?: string | null;
  initialAiMessages?: AiMessageClient[];
  initialPendingEdit?: ProposeEditResult | null;
}

function lineItemFromServer(
  li: VersionTreeClient["sections"][number]["lineItems"][number],
  marginPercent: number,
): LineItemData {
  const baseUnitPrice = baseUnitPriceFromUnitPrice(li.unitPrice, marginPercent);
  return {
    id: li.id,
    name: li.name,
    unit: li.unit,
    quantity: li.quantity,
    baseUnitPrice,
    unitPrice: li.unitPrice,
    vatRate: li.vatRate,
    sortOrder: li.sortOrder,
  };
}

function versionTreeToSections(tree: VersionTreeClient | null): SectionData[] {
  if (!tree) return [];
  const marginPercent = tree.marginPercent ?? 0;
  return tree.sections.map((s) => ({
    id: s.id,
    title: s.title,
    sortOrder: s.sortOrder,
    items: s.lineItems.map((li) => lineItemFromServer(li, marginPercent)),
  }));
}

function applyMarginToSections(
  sections: SectionData[],
  marginPercent: number,
): SectionData[] {
  return sections.map((s) => ({
    ...s,
    items: s.items.map((li) => ({
      ...li,
      unitPrice: unitPriceFromBase(li.baseUnitPrice, marginPercent),
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
  investmentPropertyType = null,
  initialAiMessages = [],
  initialPendingEdit = null,
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
  const isAiSideLayout = useEstimateAiSideLayout();
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      mediaQueryMin(ESTIMATE_LAYOUT_CONFIG.breakpoints.aiSideLayout),
    );
    if (mq.matches) {
      setShowAiPanel(true);
    }
  }, []);
  const [activeTab, setActiveTab] = useState<EstimateEditorTabId>("items");
  const { advancedMode, setAdvancedMode } = useEstimateAdvancedMode();

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

  const handleAdvancedModeChange = useCallback(
    (nextAdvanced: boolean) => {
      if (nextAdvanced && !advancedMode) {
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            items: s.items.map((li) => {
              const base =
                li.baseUnitPrice > 0
                  ? li.baseUnitPrice
                  : baseUnitPriceFromUnitPrice(li.unitPrice, marginPercent);
              return {
                ...li,
                baseUnitPrice: base,
                unitPrice: unitPriceFromBase(base, marginPercent),
              };
            }),
          })),
        );
      } else if (!nextAdvanced && advancedMode) {
        setSections((prev) =>
          prev.map((s) => ({
            ...s,
            items: s.items.map((li) => ({
              ...li,
              baseUnitPrice: li.unitPrice,
            })),
          })),
        );
      }
      setAdvancedMode(nextAdvanced);
    },
    [advancedMode, marginPercent, setAdvancedMode],
  );

  const handleMarginChange = useCallback(
    (value: number) => {
      setMarginPercent(value);
      if (advancedMode) {
        setSections((prev) => applyMarginToSections(prev, value));
      }
      if (activeVersionId) save({ marginPercent: value });
    },
    [advancedMode, activeVersionId, save],
  );

  const handleMarginBlur = useCallback(
    (value: number) => {
      setMarginPercent(value);
      if (advancedMode) {
        setSections((prev) => applyMarginToSections(prev, value));
      }
      if (activeVersionId) autosaveOnBlur({ marginPercent: value });
    },
    [advancedMode, activeVersionId, autosaveOnBlur],
  );

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
                    baseUnitPrice: 0,
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
        items: s.items.map((li) => {
          if (li.id !== itemId) return li;
          const next = { ...li, ...data };
          if (advancedMode && data.baseUnitPrice !== undefined) {
            next.unitPrice = unitPriceFromBase(next.baseUnitPrice, marginPercent);
          } else if (!advancedMode && data.unitPrice !== undefined) {
            next.baseUnitPrice = next.unitPrice;
          }
          return next;
        }),
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

  const handleReorderItems = useCallback(
    async (sectionId: string, fromIndex: number, toIndex: number) => {
      if (!activeVersionId || fromIndex === toIndex) return;

      let nextSections: SectionData[] | undefined;
      setSections((prev) => {
        nextSections = prev.map((s) => {
          if (s.id !== sectionId) return s;
          const items = [...s.items];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved!);
          return {
            ...s,
            items: items.map((li, i) => ({ ...li, sortOrder: i })),
          };
        });
        return nextSections;
      });

      if (!nextSections) return;

      const payload = nextSections.flatMap((s) =>
        s.items.map((li, i) => ({
          id: li.id,
          sectionId: s.id,
          sortOrder: i,
        })),
      );
      await reorderAction({
        versionId: activeVersionId,
        workspaceId: estimate.workspaceId,
        items: payload,
        locale,
      });
    },
    [activeVersionId, estimate.workspaceId, locale],
  );

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
  const addressData = estimate.estimateRequest?.address as
    | { streetAddress?: string; city?: string }
    | null
    | undefined;

  return (
    <div
      className={cn(
        "estimate-editor mx-auto min-w-0 w-full space-y-6 pb-8",
        estimateEditorMaxWidthClass,
      )}
    >
      <EstimateEditorLayoutStyles />
      {autosaveStatus === "conflict" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
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

      <div
        className={cn(
          "estimate-top-band",
          isGenerating && "estimate-top-band--stacked",
          !isGenerating &&
            (advancedMode ? "estimate-top-band--advanced" : "estimate-top-band--basic"),
        )}
      >
        <div className="estimate-top-band-card min-w-0">
        <EstimateContextCards
          requestNumber={estimate.estimateRequest?.requestNumber}
          customerName={customerData?.fullName}
          customerEmail={customerData?.email}
          investmentPropertyType={investmentPropertyType}
          investmentStreet={addressData?.streetAddress}
          investmentCity={addressData?.city}
          requestCreatedAt={estimate.estimateRequest?.createdAt ?? estimate.createdAt}
          updatedAt={activeVersion?.updatedAt ?? null}
          updatedBy={activeVersion?.createdByUserId ?? estimate.latestVersion?.createdByUserId}
          locale={locale}
        />
        </div>

        {!isGenerating && (
          <div className="estimate-top-band-card min-w-0">
            <EstimateRightRail
              className="h-full w-full min-w-0"
              items={allItems}
              marginPercent={marginPercent}
              currency={estimate.currency}
              advancedMode={advancedMode}
            />
          </div>
        )}
      </div>

      {isGenerating ? (
        <EstimateGeneratingSkeleton
          estimateId={estimate.id}
          workspaceSlug={workspaceSlug}
          locale={locale}
          initialStatus={requestStatus}
        />
      ) : (
        <div
          className={cn(
            "grid min-w-0 gap-6",
            showAiPanel && activeVersionId && isAiSideLayout
              ? estimateEditorAiSideGridClass
              : "",
          )}
        >
          <div className="min-w-0 space-y-4">
            <div className="min-w-0 overflow-hidden rounded-2xl border bg-card/95 shadow-sm">
              <EstimateEditorTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                attachmentsCount={0}
              />

              {activeTab === "items" ? (
                <>
                  <EstimateItemsToolbar
                    advancedMode={advancedMode}
                    onAdvancedModeChange={handleAdvancedModeChange}
                    marginPercent={marginPercent}
                    onMarginChange={handleMarginChange}
                    onMarginBlur={handleMarginBlur}
                    onAddSection={handleAddSection}
                    showAiPanel={showAiPanel}
                    onToggleAiPanel={() => setShowAiPanel((v) => !v)}
                    aiUsesSideLayout={isAiSideLayout}
                  />
                  <EstimateItemsTable
                    sections={sections}
                    currency={estimate.currency}
                    advancedMode={advancedMode}
                    onUpdateSection={handleUpdateSection}
                    onDeleteSection={handleDeleteSection}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    onReorderItems={handleReorderItems}
                    onBlur={triggerBlurSave}
                  />
                </>
              ) : (
                <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                  {t("editor.tabPlaceholder")}
                </div>
              )}
            </div>
          </div>

          {showAiPanel && activeVersionId && isAiSideLayout ? (
            <div className="estimate-ai-sticky">
              <EstimateAiPanel
                versionId={activeVersionId}
                workspaceId={estimate.workspaceId}
                workspaceSlug={workspaceSlug}
                estimateId={estimate.id}
                locale={locale}
                maxUndoSteps={3}
                onApproved={handleAiMutation}
                initialMessages={initialAiMessages}
                initialPendingEdit={initialPendingEdit}
              />
            </div>
          ) : null}
        </div>
      )}

      {!isGenerating && activeVersionId && !isAiSideLayout ? (
        <EstimateAiFloating
          open={showAiPanel}
          onOpenChange={setShowAiPanel}
          versionId={activeVersionId}
          workspaceId={estimate.workspaceId}
          workspaceSlug={workspaceSlug}
          estimateId={estimate.id}
          locale={locale}
          maxUndoSteps={3}
          onApproved={handleAiMutation}
          initialMessages={initialAiMessages}
          initialPendingEdit={initialPendingEdit}
        />
      ) : null}
    </div>
  );
}
