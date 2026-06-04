"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bot, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { EstimateMarginControl } from "./estimate-margin-control";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";
import type { LineItemCalcInput } from "@/features/estimates/lib/calculate-estimate";
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
  investmentPropertyType = null,
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
  const [showAiPanel, setShowAiPanel] = useState(true);

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
  const addressData = estimate.estimateRequest?.address as
    | { streetAddress?: string; city?: string }
    | null
    | undefined;

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1760px] space-y-6 pb-8">
      {autosaveStatus === "conflict" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
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
        className={cn("estimate-top-band", isGenerating && "estimate-top-band--stacked")}
      >
        <div className="min-w-0">
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
          <EstimateRightRail
            className="min-w-0 h-full"
            items={allItems}
            marginPercent={marginPercent}
            currency={estimate.currency}
          />
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
            showAiPanel && activeVersionId
              ? "min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] min-[1400px]:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]"
              : "",
          )}
        >
          <div className="min-w-0 space-y-4">
            <div className="min-w-0 overflow-x-auto rounded-3xl border bg-card/95 p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/70">
                    {t("editor.itemsEyebrow")}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">
                    {t("editor.items")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={estimateOutlineButtonClassName}
                    onClick={handleAddSection}
                  >
                    <Plus className="size-4" />
                    {t("editor.addSection")}
                  </Button>
                  <EstimateMarginControl
                    marginPercent={marginPercent}
                    onChange={(v) => {
                      setMarginPercent(v);
                      triggerSave();
                    }}
                    onBlur={(v) => {
                      setMarginPercent(v);
                      triggerBlurSave();
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className={estimateOutlineButtonClassName}
                    onClick={() => setShowAiPanel((v) => !v)}
                  >
                    <Bot className="size-4" />
                    {showAiPanel ? t("editor.hideAi") : t("editor.aiAssistant")}
                  </Button>
                </div>
              </div>

              <EstimateItemsTable
                sections={sections}
                currency={estimate.currency}
                onUpdateSection={handleUpdateSection}
                onDeleteSection={handleDeleteSection}
                onAddItem={handleAddItem}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onBlur={triggerBlurSave}
              />
            </div>
          </div>

          {showAiPanel && activeVersionId && (
            <div className="min-w-0 min-[1100px]:sticky min-[1100px]:top-6 min-[1100px]:self-start">
              <EstimateAiPanel
                versionId={activeVersionId}
                workspaceId={estimate.workspaceId}
                workspaceSlug={workspaceSlug}
                estimateId={estimate.id}
                locale={locale}
                maxUndoSteps={3}
                onApproved={handleAiMutation}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
