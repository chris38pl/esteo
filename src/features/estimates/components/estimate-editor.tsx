"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEstimateAutosave } from "@/features/estimates/hooks/use-estimate-autosave";
import { useEstimatePdfExport } from "@/features/estimates/hooks/use-estimate-pdf-export";
import { useEstimatePdfPreview } from "@/features/estimates/hooks/use-estimate-pdf-preview";
import { useEstimateAdvancedMode } from "@/features/estimates/hooks/use-estimate-advanced-mode";
import { useEstimateFocusMode } from "@/features/estimates/hooks/use-estimate-focus-mode";
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
import { EstimatePdfPreviewDialog } from "./estimate-pdf-preview-dialog";
import { EstimatePdfDocumentsSection } from "./estimate-pdf-documents-section";
import { EstimateMobileStickyBar } from "./estimate-mobile-sticky-bar";
import { EstimateContextCards } from "./estimate-context-cards";
import { EstimateItemsView } from "./estimate-items-view";
import { EstimateRightRail } from "./estimate-right-rail";
import { EstimateAiPanel } from "./estimate-ai-panel";
import { EstimateAiFloating } from "./estimate-ai-floating";
import {
  ESTIMATE_LAYOUT_CONFIG,
  estimateEditorAiSideGridClass,
  estimateEditorMobileStickyPaddingClass,
  estimateEditorTabShellClass,
  estimateEditorTabShellNarrowClass,
  mediaQueryMin,
} from "@/features/estimates/lib/estimate-layout-config";
import { useEstimateAiSideLayout } from "@/features/estimates/hooks/use-estimate-ai-side-layout";
import { useEstimateAiStickyMaxHeight } from "@/features/estimates/hooks/use-estimate-ai-sticky-max-height";
import type { AvatarPreset } from "@/components/avatars/user-avatar";
import type { EstimateActivityLogClient } from "@/features/estimates/lib/serialize-estimate-activity";
import type { EstimateNoteClient } from "@/features/estimates/lib/serialize-estimate-notes";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import { computePaymentSummary } from "@/features/estimates/lib/payment-installment-summary";
import type { Currency } from "@/i18n/formatters";
import { EstimateHistoryPanel } from "./estimate-history-panel";
import { EstimateAttachmentsPanel } from "@/features/attachments/components/estimate-attachments-panel";
import type {
  EstimateAttachmentClient,
  WorkspaceStorageSummaryClient,
} from "@/features/attachments/lib/serialize-attachments";
import type { EstimatePdfClient } from "@/features/estimates/lib/serialize-estimate-pdfs";
import { EstimateNotesPanel } from "./estimate-notes-panel";
import { EstimatePaymentsPanel } from "./estimate-payments-panel";
import { EstimateSummaryPanel } from "./summary/estimate-summary-panel";
import { EstimateOverduePaymentsBanner } from "./estimate-overdue-payments-banner";
import { EstimateEditorLayoutStyles } from "./estimate-editor-layout-styles";
import { EstimateGeneratingSkeleton } from "./estimate-generating-skeleton";
import { EstimateAiDraftRecoveryBanner } from "./estimate-ai-draft-recovery-banner";
import {
  EstimateEditorTabs,
  type EstimateEditorTabId,
} from "./estimate-editor-tabs";
import {
  calculateEstimate,
  type LineItemCalcInput,
} from "@/features/estimates/lib/calculate-estimate";
import {
  baseUnitPriceFromUnitPrice,
  unitPriceFromBase,
} from "@/features/estimates/lib/margin-pricing";
import type {
  AiMessageClient,
} from "@/features/estimates/lib/serialize-ai-messages";
import type { ProposeEditResult } from "@/features/estimates/lib/estimate-agent-types";
import { isEstimateVersionEditable } from "@/features/estimates/lib/version-mutability";
import { sectionsToAutoSaveData } from "@/features/estimates/lib/sections-to-autosave";
import type { AutoSaveData } from "@/features/estimates/server/repository";
import {
  shouldApplyVersionTreeFromServer,
  versionTreeStructureKey,
} from "@/features/estimates/lib/version-tree-sync";
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
  isPinned?: boolean;
  userEmailsById?: Record<string, string>;
  initialNotes?: EstimateNoteClient[];
  initialActivityLogs?: EstimateActivityLogClient[];
  initialPaymentInstallments?: PaymentInstallmentClient[];
  initialAttachments?: EstimateAttachmentClient[];
  initialPdfDocuments?: EstimatePdfClient[];
  storageSummary?: WorkspaceStorageSummaryClient;
  currentUserId?: string;
  currentUserAvatarUrl?: string | null;
  currentUserAvatarPreset?: AvatarPreset | null;
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
  isPinned = false,
  userEmailsById = {},
  initialNotes = [],
  initialActivityLogs = [],
  initialPaymentInstallments = [],
  initialAttachments = [],
  initialPdfDocuments = [],
  storageSummary = {
    usedBytes: "0",
    limitBytes: "262144000",
    usedFormatted: "0 B",
    limitFormatted: "250 MB",
    usedPercent: 0,
    level: "ok",
  },
  currentUserId = "",
  currentUserAvatarUrl = null,
  currentUserAvatarPreset = null,
}: EstimateEditorProps) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [sections, setSections] = useState<SectionData[]>(() =>
    versionTreeToSections(versionTree),
  );
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const [marginPercent, setMarginPercent] = useState<number>(versionTree?.marginPercent ?? 0);
  const marginPercentRef = useRef(marginPercent);
  marginPercentRef.current = marginPercent;
  const [versionUpdatedAt, setVersionUpdatedAt] = useState(
    versionTree?.updatedAt ?? new Date().toISOString(),
  );
  const isDirtyRef = useRef(false);
  const dirtyGenerationRef = useRef(0);
  const persistGenerationSnapshotRef = useRef(0);
  const isSavingRef = useRef(false);
  const forceApplyVersionTreeRef = useRef(false);
  const wasGeneratingRef = useRef(false);
  const lastAppliedStructureRef = useRef(versionTreeStructureKey(versionTree));
  const isAiSideLayout = useEstimateAiSideLayout();
  const [showAiPanel, setShowAiPanel] = useState(false);
  const aiStickyRef = useRef<HTMLDivElement>(null);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [mobilePositionSheetOpen, setMobilePositionSheetOpen] = useState(false);
  const [paymentInstallments, setPaymentInstallments] = useState<PaymentInstallmentClient[]>(
    initialPaymentInstallments,
  );
  const [attachmentsCount, setAttachmentsCount] = useState(initialAttachments.length);

  useEffect(() => {
    setAttachmentsCount(initialAttachments.length);
  }, [initialAttachments]);

  useEffect(() => {
    const mq = window.matchMedia(
      mediaQueryMin(ESTIMATE_LAYOUT_CONFIG.breakpoints.aiSideLayout),
    );
    if (mq.matches) {
      setShowAiPanel(true);
    }
  }, []);
  const [activeTab, setActiveTab] = useState<EstimateEditorTabId>("items");
  const isItemsTab = activeTab === "items";
  const isWideTabShell = activeTab === "items" || activeTab === "summary";
  const showSideAiPanel =
    showAiPanel && Boolean(activeVersionId) && isAiSideLayout && isItemsTab;
  const aiStickyMaxHeight = useEstimateAiStickyMaxHeight(aiStickyRef, showSideAiPanel);
  const { advancedMode, setAdvancedMode } = useEstimateAdvancedMode();
  const { topPanelHidden, toggleTopPanel } = useEstimateFocusMode();

  const requestStatus = estimate.estimateRequest?.status ?? null;
  const isGenerating =
    requestStatus === "PENDING" || requestStatus === "PROCESSING";
  const canManualRetryAiDraft = estimate.canManualRetryAiDraft;

  const activeVersion = versionTree;
  const versionStatus = activeVersion?.status ?? "DRAFT";
  const isVersionReadOnly = !isEstimateVersionEditable(versionStatus);
  const allVersions = estimate.versions.map((v) => ({
    id: v.id,
    versionNumber: v.versionNumber,
    status: v.status,
  }));

  const commitSections = useCallback((updater: (prev: SectionData[]) => SectionData[]) => {
    const next = updater(sectionsRef.current);
    sectionsRef.current = next;
    setSections(next);
    return next;
  }, []);

  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    dirtyGenerationRef.current += 1;
  }, []);

  const buildAutosavePayload = useCallback((): AutoSaveData => {
    const { sections: sectionsPayload } = sectionsToAutoSaveData(sectionsRef.current);
    return {
      marginPercent: marginPercentRef.current,
      sections: sectionsPayload,
    };
  }, []);

  const { status: autosaveStatus, save, onBlur: autosaveOnBlur } = useEstimateAutosave({
    versionId: activeVersionId ?? "",
    workspaceId: estimate.workspaceId,
    initialUpdatedAt: versionUpdatedAt,
    locale,
    enabled: !isVersionReadOnly,
    onPersistStart: () => {
      isSavingRef.current = true;
      persistGenerationSnapshotRef.current = dirtyGenerationRef.current;
    },
    onPersisted: (updatedAt, { isQueueIdle }) => {
      isSavingRef.current = false;
      setVersionUpdatedAt(updatedAt);
      if (
        isQueueIdle &&
        dirtyGenerationRef.current === persistGenerationSnapshotRef.current
      ) {
        isDirtyRef.current = false;
      }
    },
    onPersistError: () => {
      isSavingRef.current = false;
    },
  });

  const ensureSavedBeforePdfExport = useCallback(async (): Promise<boolean> => {
    if (isVersionReadOnly) {
      return true;
    }

    if (!isDirtyRef.current && autosaveStatus !== "saving" && !isSavingRef.current) {
      return true;
    }

    await autosaveOnBlur(buildAutosavePayload());

    for (let attempt = 0; attempt < 24; attempt += 1) {
      if (!isSavingRef.current && !isDirtyRef.current) {
        return true;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });
    }

    return false;
  }, [autosaveOnBlur, autosaveStatus, buildAutosavePayload, isVersionReadOnly]);

  const { exportPdf } = useEstimatePdfExport({
    estimateId: estimate.id,
    versionId: activeVersionId,
    workspaceId: estimate.workspaceId,
    workspaceSlug,
    locale,
    onBeforeExport: ensureSavedBeforePdfExport,
  });

  const { previewPdf, isPreviewLoading, previewState, closePreview } =
    useEstimatePdfPreview({
      estimateId: estimate.id,
      versionId: activeVersionId,
      workspaceId: estimate.workspaceId,
      workspaceSlug,
      locale,
      onBeforeExport: ensureSavedBeforePdfExport,
    });

  const isPdfPreviewOpen = previewState.status !== "closed";

  useEffect(() => {
    if (isPdfPreviewOpen) {
      setShowAiPanel(false);
    }
  }, [isPdfPreviewOpen]);

  const applyVersionTree = useCallback((tree: VersionTreeClient | null) => {
    const nextSections = versionTreeToSections(tree);
    sectionsRef.current = nextSections;
    setSections(nextSections);
    const nextMargin = tree?.marginPercent ?? 0;
    marginPercentRef.current = nextMargin;
    setMarginPercent(nextMargin);
    if (tree?.updatedAt) {
      setVersionUpdatedAt(tree.updatedAt);
    }
    lastAppliedStructureRef.current = versionTreeStructureKey(tree);
  }, []);

  useEffect(() => {
    if (!versionTree) return;

    const generationJustFinished = wasGeneratingRef.current && !isGenerating;

    if (isGenerating) {
      wasGeneratingRef.current = true;
      return;
    }

    wasGeneratingRef.current = false;

    const forceApply = forceApplyVersionTreeRef.current;
    if (forceApply) {
      forceApplyVersionTreeRef.current = false;
    }

    if (
      !shouldApplyVersionTreeFromServer({
        isDirty: isDirtyRef.current,
        isSaving: isSavingRef.current,
        generationJustFinished,
        forceApply,
      })
    ) {
      return;
    }

    applyVersionTree(versionTree);
  }, [versionTree, isGenerating, applyVersionTree]);

  const handleAiMutation = useCallback(
    (result: { updatedAt: string; versionTree: VersionTreeClient | null }) => {
      isDirtyRef.current = false;
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
    save(buildAutosavePayload());
  }, [activeVersionId, save, buildAutosavePayload]);

  const triggerBlurSave = useCallback(async () => {
    if (!activeVersionId) return;
    await autosaveOnBlur(buildAutosavePayload());
  }, [activeVersionId, autosaveOnBlur, buildAutosavePayload]);

  const handleAddSection = async (): Promise<string | undefined> => {
    if (!activeVersionId || isVersionReadOnly) return undefined;
    const result = await addSectionAction({
      versionId: activeVersionId,
      workspaceId: estimate.workspaceId,
      title: t("editor.newSection"),
      locale,
    });
    if (result.success) {
      const sectionId = result.data.sectionId;
      commitSections((prev) => [
        ...prev,
        {
          id: sectionId,
          title: t("editor.newSection"),
          sortOrder: prev.length,
          items: [],
        },
      ]);
      return sectionId;
    }
    return undefined;
  };

  const handleUpdateSection = (sectionId: string, title: string) => {
    if (isVersionReadOnly) return;
    commitSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    );
    markDirty();
    triggerSave();
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (isVersionReadOnly) return;
    commitSections((prev) => prev.filter((s) => s.id !== sectionId));
    await deleteSectionAction({
      sectionId,
      workspaceId: estimate.workspaceId,
      locale,
    });
  };

  const handleAdvancedModeChange = useCallback(
    (nextAdvanced: boolean) => {
      if (isVersionReadOnly) return;
      if (nextAdvanced && !advancedMode) {
        commitSections((prev) =>
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
        commitSections((prev) =>
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
    [advancedMode, isVersionReadOnly, marginPercent, setAdvancedMode, commitSections],
  );

  const handleMarginChange = useCallback(
    (value: number) => {
      if (isVersionReadOnly) return;
      marginPercentRef.current = value;
      setMarginPercent(value);
      if (advancedMode) {
        commitSections((prev) => applyMarginToSections(prev, value));
      }
      markDirty();
      if (activeVersionId) save(buildAutosavePayload());
    },
    [advancedMode, activeVersionId, isVersionReadOnly, save, commitSections, markDirty, buildAutosavePayload],
  );

  const handleMarginBlur = useCallback(
    (value: number) => {
      if (isVersionReadOnly) return;
      marginPercentRef.current = value;
      setMarginPercent(value);
      if (advancedMode) {
        commitSections((prev) => applyMarginToSections(prev, value));
      }
      markDirty();
      if (activeVersionId) void autosaveOnBlur(buildAutosavePayload());
    },
    [advancedMode, activeVersionId, isVersionReadOnly, autosaveOnBlur, commitSections, markDirty, buildAutosavePayload],
  );

  const handleAddItem = async (sectionId: string) => {
    if (!activeVersionId || isVersionReadOnly) return;
    const result = await addLineItemAction({
      sectionId,
      workspaceId: estimate.workspaceId,
      locale,
    });
    if (result.success) {
      commitSections((prev) =>
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
    if (isVersionReadOnly) return;
    commitSections((prev) =>
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
    markDirty();
    triggerSave();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (isVersionReadOnly) return;
    commitSections((prev) =>
      prev.map((s) => ({ ...s, items: s.items.filter((li) => li.id !== itemId) })),
    );
    await deleteLineItemAction({
      itemId,
      workspaceId: estimate.workspaceId,
      locale,
    });
  };

  const handleDuplicateItem = async (sectionId: string, itemId: string) => {
    if (!activeVersionId || isVersionReadOnly) return;
    const sourceSection = sections.find((s) => s.id === sectionId);
    const sourceItem = sourceSection?.items.find((li) => li.id === itemId);
    if (!sourceItem) return;

    const result = await addLineItemAction({
      sectionId,
      workspaceId: estimate.workspaceId,
      locale,
    });
    if (!result.success) return;

    const duplicated: LineItemData = {
      id: result.data.itemId,
      name: sourceItem.name,
      unit: sourceItem.unit,
      quantity: sourceItem.quantity,
      baseUnitPrice: sourceItem.baseUnitPrice,
      unitPrice: sourceItem.unitPrice,
      vatRate: sourceItem.vatRate,
      sortOrder: sourceSection!.items.length,
    };

    commitSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, items: [...s.items, duplicated] } : s,
      ),
    );
    markDirty();
    triggerSave();
  };

  const handleReorderItems = useCallback(
    async (sectionId: string, fromIndex: number, toIndex: number) => {
      if (!activeVersionId || isVersionReadOnly || fromIndex === toIndex) return;

      const nextSections = commitSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const items = [...s.items];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved!);
          return {
            ...s,
            items: items.map((li, i) => ({ ...li, sortOrder: i })),
          };
        }),
      );

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
    [activeVersionId, estimate.workspaceId, locale, commitSections],
  );

  const allItems: LineItemCalcInput[] = sections.flatMap((s) =>
    s.items.map((li) => ({
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      vatRate: li.vatRate,
    })),
  );

  const customerTotalGross = calculateEstimate(allItems, marginPercent).totalGross;
  const paymentSummary = computePaymentSummary(customerTotalGross, paymentInstallments);
  const estimateCurrency: Currency = estimate.currency === "EUR" ? "EUR" : "PLN";

  const customerData = estimate.estimateRequest?.customerData as
    | { fullName?: string; email?: string }
    | null
    | undefined;
  const addressData = estimate.estimateRequest?.address as
    | { streetAddress?: string; city?: string }
    | null
    | undefined;

  const versionCreatorId =
    activeVersion?.createdByUserId ?? estimate.latestVersion?.createdByUserId ?? null;
  const updatedByEmail = versionCreatorId
    ? (userEmailsById[versionCreatorId] ?? null)
    : null;

  return (
    <div
      className={cn(
        "estimate-editor mx-auto min-w-0 w-full space-y-6 pb-8",
        !isGenerating && estimateEditorMobileStickyPaddingClass,
      )}
    >
      <EstimateEditorLayoutStyles />
      {isVersionReadOnly ? (
        <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {t("editor.archivedBanner")}
        </div>
      ) : null}
      {autosaveStatus === "conflict" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          {t("editor.conflictBanner")}{" "}
          <button
            className="underline underline-offset-4"
            onClick={() => {
              forceApplyVersionTreeRef.current = true;
              isDirtyRef.current = false;
              router.refresh();
            }}
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
        isPinned={isPinned}
        canManualRetryAiDraft={canManualRetryAiDraft}
        onBeforePdfExport={ensureSavedBeforePdfExport}
        onPreviewPdf={previewPdf}
        isPreviewLoading={isPreviewLoading}
      />

      <EstimatePdfPreviewDialog
        state={previewState}
        onOpenChange={(open) => {
          if (!open) {
            closePreview();
          }
        }}
      />

      {!topPanelHidden ? (
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
              updatedByEmail={updatedByEmail}
              locale={locale}
            />
          </div>

          {!isGenerating ? (
            <div className="estimate-top-band-card min-w-0">
              <EstimateRightRail
                className="h-full w-full min-w-0"
                items={allItems}
                marginPercent={marginPercent}
                onMarginChange={handleMarginChange}
                onMarginBlur={handleMarginBlur}
                readOnly={isVersionReadOnly}
                currency={estimate.currency}
                advancedMode={advancedMode}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {isGenerating ? (
        <EstimateGeneratingSkeleton
          estimateId={estimate.id}
          workspaceId={estimate.workspaceId}
          workspaceSlug={workspaceSlug}
          locale={locale}
          initialStatus={requestStatus}
          initialCanManualRetry={canManualRetryAiDraft}
        />
      ) : (
        <div
          className={cn(
            "min-w-0",
            showAiPanel && activeVersionId && isAiSideLayout && isItemsTab
              ? estimateEditorAiSideGridClass
              : "grid gap-6",
          )}
        >
          <div className="min-w-0 space-y-4">
            <EstimateOverduePaymentsBanner
              overdueCount={paymentSummary.overdueCount}
              onOpenPayments={() => setActiveTab("payments")}
            />
            <div
              className={cn(
                estimateEditorTabShellClass,
                !isWideTabShell && estimateEditorTabShellNarrowClass,
              )}
            >
              <div className="min-w-0 overflow-hidden rounded-2xl border bg-card/95 shadow-sm">
              <EstimateEditorTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                attachmentsCount={attachmentsCount}
                overduePaymentsCount={paymentSummary.overdueCount}
                topPanelHidden={topPanelHidden}
                onToggleTopPanel={toggleTopPanel}
              />

              {activeTab === "history" ? (
                <EstimateHistoryPanel initialLogs={initialActivityLogs} />
              ) : activeTab === "notes" ? (
                <EstimateNotesPanel
                  estimateId={estimate.id}
                  workspaceId={estimate.workspaceId}
                  workspaceSlug={workspaceSlug}
                  locale={locale}
                  initialNotes={initialNotes}
                  currentUserId={currentUserId}
                  currentUserAvatarUrl={currentUserAvatarUrl}
                  currentUserAvatarPreset={currentUserAvatarPreset}
                />
              ) : activeTab === "payments" ? (
                <EstimatePaymentsPanel
                  estimateId={estimate.id}
                  workspaceId={estimate.workspaceId}
                  workspaceSlug={workspaceSlug}
                  locale={locale}
                  currency={estimateCurrency}
                  customerTotalGross={customerTotalGross}
                  installments={paymentInstallments}
                  onInstallmentsChange={setPaymentInstallments}
                />
              ) : activeTab === "attachments" ? (
                <EstimateAttachmentsPanel
                  estimateId={estimate.id}
                  workspaceId={estimate.workspaceId}
                  workspaceSlug={workspaceSlug}
                  locale={locale}
                  initialAttachments={initialAttachments}
                  storageSummary={storageSummary}
                  readOnly={isVersionReadOnly}
                  onAttachmentsCountChange={setAttachmentsCount}
                />
              ) : activeTab === "documents" ? (
                <EstimatePdfDocumentsSection
                  estimateId={estimate.id}
                  workspaceId={estimate.workspaceId}
                  locale={locale}
                  documents={initialPdfDocuments}
                />
              ) : activeTab === "summary" ? (
                <EstimateSummaryPanel
                  estimate={estimate}
                  versionTree={versionTree}
                  activeVersionId={activeVersionId}
                  activityLogs={initialActivityLogs}
                  workspaceSlug={workspaceSlug}
                  locale={locale}
                  currency={estimateCurrency}
                  customerTotalGross={customerTotalGross}
                  installments={paymentInstallments}
                  attachments={initialAttachments}
                  onOpenTab={setActiveTab}
                  onExportPdf={exportPdf}
                />
              ) : activeTab === "items" ? (
                <fieldset
                  disabled={isVersionReadOnly}
                  className="min-w-0 border-0 p-0 disabled:opacity-80"
                >
                  {canManualRetryAiDraft && !isGenerating ? (
                    <EstimateAiDraftRecoveryBanner
                      estimateId={estimate.id}
                      workspaceId={estimate.workspaceId}
                      workspaceSlug={workspaceSlug}
                      locale={locale}
                      variant={requestStatus === "FAILED" ? "failed" : "missing"}
                    />
                  ) : null}
                  <EstimateItemsView
                    sections={sections}
                    currency={estimate.currency}
                    advancedMode={advancedMode}
                    marginPercent={marginPercent}
                    tableSearchQuery={tableSearchQuery}
                    onAdvancedModeChange={handleAdvancedModeChange}
                    onMarginChange={handleMarginChange}
                    onMarginBlur={handleMarginBlur}
                    onAddSection={handleAddSection}
                    showAiPanel={showAiPanel}
                    onToggleAiPanel={() => setShowAiPanel((v) => !v)}
                    aiUsesSideLayout={isAiSideLayout}
                    onTableSearchQueryChange={setTableSearchQuery}
                    onUpdateSection={handleUpdateSection}
                    onDeleteSection={handleDeleteSection}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    onDuplicateItem={handleDuplicateItem}
                    onReorderItems={handleReorderItems}
                    onBlur={triggerBlurSave}
                    topPanelHidden={topPanelHidden}
                    onToggleTopPanel={toggleTopPanel}
                    onMobilePositionSheetOpenChange={setMobilePositionSheetOpen}
                  />
                </fieldset>
              ) : (
                <div className="px-4 py-16 text-center text-sm text-muted-foreground">
                  {t("editor.tabPlaceholder")}
                </div>
              )}
              </div>
            </div>
          </div>

          {showSideAiPanel ? (
            <div
              ref={aiStickyRef}
              className="estimate-ai-sticky"
              style={
                {
                  "--estimate-ai-side-min-h": `${ESTIMATE_LAYOUT_CONFIG.stickyAi.sideMinHeightVh}dvh`,
                  ...(aiStickyMaxHeight != null
                    ? {
                        "--estimate-ai-sticky-max-h": `${aiStickyMaxHeight}px`,
                      }
                    : {}),
                } as React.CSSProperties
              }
            >
              <EstimateAiPanel
                versionId={activeVersionId ?? ""}
                workspaceId={estimate.workspaceId}
                workspaceSlug={workspaceSlug}
                estimateId={estimate.id}
                locale={locale}
                maxUndoSteps={3}
                readOnly={isVersionReadOnly}
                onApproved={handleAiMutation}
                initialMessages={initialAiMessages}
                initialPendingEdit={initialPendingEdit}
              />
            </div>
          ) : null}
        </div>
      )}

      {!isGenerating ? (
        <EstimateMobileStickyBar items={allItems} currency={estimate.currency} />
      ) : null}

      {!isGenerating && activeVersionId && !isAiSideLayout && isItemsTab ? (
        <EstimateAiFloating
          open={showAiPanel}
          onOpenChange={setShowAiPanel}
          hideTrigger={mobilePositionSheetOpen}
          suppressed={isPdfPreviewOpen}
          versionId={activeVersionId}
          workspaceId={estimate.workspaceId}
          workspaceSlug={workspaceSlug}
          estimateId={estimate.id}
          locale={locale}
          maxUndoSteps={3}
          readOnly={isVersionReadOnly}
          onApproved={handleAiMutation}
          initialMessages={initialAiMessages}
          initialPendingEdit={initialPendingEdit}
        />
      ) : null}
    </div>
  );
}
