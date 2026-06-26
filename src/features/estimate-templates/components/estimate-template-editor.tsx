"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { appToast } from "@/components/ui/app-toast";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import "@/features/estimates/styles/estimate-editor-layout.css";
import {
  estimateEditorTabShellClass,
} from "@/features/estimates/lib/estimate-layout-config";
import {
  EstimateTemplateDefaultNotice,
  EstimateTemplateDetailHeader,
} from "@/features/estimate-templates/components/estimate-template-detail-header";
import { EstimateTemplatesSidebar } from "@/features/estimate-templates/components/estimate-templates-sidebar";
import { useTemplateAdvancedMode } from "@/features/estimate-templates/hooks/use-template-advanced-mode";
import { useTemplateAutosave } from "@/features/estimate-templates/hooks/use-template-autosave";
import {
  countDraftItems,
  countDraftSections,
} from "@/features/estimate-templates/lib/template-display";
import {
  ESTIMATE_TEMPLATE_MAX_ITEMS_PER_SECTION,
  ESTIMATE_TEMPLATE_MAX_SECTIONS,
} from "@/features/estimate-templates/lib/template-limits";
import { TemplateEstimateGenerationModeField } from "@/features/estimate-templates/components/template-estimate-generation-mode-field";
import {
  buildTemplatePayload,
  createTemplateDraftId,
  isTemplateDraftSavable,
  mergeTemplateDraftAfterSave,
  type TemplateEditorDraft,
  type TemplateItemDraft,
} from "@/features/estimate-templates/lib/template-editor-draft";
import type { TemplateGenerationMode as EstimateAiGenerationMode } from "@/features/estimate-templates/lib/template-generation-mode";
import {
  createEstimateTemplateAction,
  generateTemplateFromPromptAction,
  updateEstimateTemplateAction,
} from "@/features/workspace-configuration/server/actions";
import { TemplateGeneratingSkeleton } from "@/features/estimate-templates/components/template-generating-skeleton";
import { templatesListHrefWithAiOpen } from "@/features/estimate-templates/components/generate-template-ai-dialog";
import type { TemplateGenerationMode } from "@/ai/prompts/template-generation";
import {
  clearTemplateAiSession,
  readTemplateAiSession,
} from "@/features/estimate-templates/lib/template-ai-storage";
import type {
  ConfigurationAccess,
  SerializedTemplateListItem,
} from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";
import { TemplateItemsView } from "./template-items-view";

interface EstimateTemplateEditorProps {
  templateId: string | null;
  initialDraft: TemplateEditorDraft;
  initialUpdatedAt?: string | null;
  templates: SerializedTemplateListItem[];
  defaultTemplateId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  access: ConfigurationAccess;
  showSystemTemplate: boolean;
  initialSource?: "ai" | null;
}

export function EstimateTemplateEditor({
  templateId,
  initialDraft,
  initialUpdatedAt = null,
  templates,
  defaultTemplateId,
  workspaceId,
  workspaceSlug,
  locale,
  access,
  showSystemTemplate,
  initialSource = null,
}: EstimateTemplateEditorProps) {
  const tWorkspace = useTranslations("workspaces.configuration.templates.workspace");
  const tAi = useTranslations("workspaces.configuration.templates.ai");
  const router = useRouter();
  const readOnly = !access.canEditPremiumConfiguration;
  const [draft, setDraft] = useState<TemplateEditorDraft>(initialDraft);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(templateId);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [addingItemSectionIds, setAddingItemSectionIds] = useState<string[]>([]);
  const [pendingAiSave, setPendingAiSave] = useState(false);
  const [aiSkeletonState, setAiSkeletonState] = useState<
    "idle" | "generating" | "error" | "prompt-missing"
  >(initialSource === "ai" ? "generating" : "idle");
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const [isAiRetryPending, setIsAiRetryPending] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const draftRef = useRef(initialDraft);
  const aiPromptRef = useRef<{ prompt: string; mode: TemplateGenerationMode } | null>(null);
  const aiGenerationStartedRef = useRef(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const { advancedMode, setAdvancedMode } = useTemplateAdvancedMode();
  const isDefault = Boolean(currentTemplateId && currentTemplateId === defaultTemplateId);

  const persistDraft = useCallback(async (): Promise<boolean> => {
    if (!isTemplateDraftSavable(draftRef.current)) {
      return true;
    }

    const payload = buildTemplatePayload(draftRef.current);

    if (currentTemplateId) {
      const result = await updateEstimateTemplateAction(
        {
          workspaceId,
          workspaceSlug,
          templateId: currentTemplateId,
          template: payload,
        },
        locale,
      );
      if (!result.success) {
        appToast.error(result.error);
        return false;
      }
      setDraft((current) => mergeTemplateDraftAfterSave(current, result.data));
      setUpdatedAt(result.data.updatedAt);
      return true;
    }

    const result = await createEstimateTemplateAction(
      { workspaceId, workspaceSlug, template: payload },
      locale,
    );
    if (!result.success) {
      appToast.error(result.error);
      return false;
    }

    setCurrentTemplateId(result.data.id);
    setDraft((current) => mergeTemplateDraftAfterSave(current, result.data));
    setUpdatedAt(result.data.updatedAt);
    router.replace(
      `/${locale}/dashboard/${workspaceSlug}/configuration/templates/${result.data.id}`,
    );
    return true;
  }, [currentTemplateId, locale, router, workspaceId, workspaceSlug]);

  const { status, scheduleSave, saveNow } = useTemplateAutosave({
    enabled: !readOnly && !pendingAiSave,
    canSave: isTemplateDraftSavable(draft),
    getCanSave: () => isTemplateDraftSavable(draftRef.current),
    onSave: persistDraft,
  });

  const runAiGeneration = useCallback(
    async (prompt: string, mode: TemplateGenerationMode) => {
      setAiSkeletonState("generating");
      setAiErrorMessage(null);

      const result = await generateTemplateFromPromptAction(
        {
          workspaceId,
          userOutline: prompt,
          generationMode: mode,
        },
        locale,
      );

      if (!result.success) {
        setAiSkeletonState("error");
        setAiErrorMessage(result.error);
        return;
      }

      setDraft(result.data);
      setPendingAiSave(true);
      setAiSkeletonState("idle");
      router.replace(`/${locale}/dashboard/${workspaceSlug}/configuration/templates/new`);
    },
    [locale, router, workspaceId, workspaceSlug],
  );

  useEffect(() => {
    if (initialSource !== "ai" || aiGenerationStartedRef.current) {
      return;
    }
    aiGenerationStartedRef.current = true;

    const session = readTemplateAiSession();
    if (!session) {
      setAiSkeletonState("prompt-missing");
      return;
    }

    clearTemplateAiSession();
    aiPromptRef.current = session;
    void runAiGeneration(session.prompt, session.mode);
  }, [initialSource, runAiGeneration]);

  const touchDraft = useCallback(
    (next: TemplateEditorDraft) => {
      setDraft(next);
      if (!pendingAiSave) {
        scheduleSave();
      }
    },
    [pendingAiSave, scheduleSave],
  );

  const handleBackToGenerate = useCallback(() => {
    router.push(templatesListHrefWithAiOpen(locale, workspaceSlug));
  }, [locale, router, workspaceSlug]);

  const handleAiRetry = useCallback(() => {
    const session = aiPromptRef.current;
    if (!session) {
      setAiSkeletonState("prompt-missing");
      return;
    }
    setIsAiRetryPending(true);
    void runAiGeneration(session.prompt, session.mode).finally(() => {
      setIsAiRetryPending(false);
    });
  }, [runAiGeneration]);

  const handleSaveTemplate = useCallback(async () => {
    if (!pendingAiSave || readOnly) {
      return;
    }
    setIsSavingTemplate(true);
    const success = await persistDraft();
    setIsSavingTemplate(false);
    if (success) {
      setPendingAiSave(false);
    }
  }, [pendingAiSave, persistDraft, readOnly]);

  const handleBlur = useCallback(async () => {
    if (pendingAiSave) {
      return;
    }
    await saveNow();
  }, [pendingAiSave, saveNow]);

  const handleAddSection = useCallback(async () => {
    if (draft.sections.length >= ESTIMATE_TEMPLATE_MAX_SECTIONS) {
      return undefined;
    }
    const sectionId = createTemplateDraftId();
    touchDraft({
      ...draft,
      sections: [
        ...draft.sections,
        {
          id: sectionId,
          title: "",
          guidance: "",
          sortOrder: draft.sections.length,
          items: [{ id: createTemplateDraftId(), name: "", unit: "", unitPrice: "", vatRate: "", note: "", sortOrder: 0 }],
        },
      ],
    });
    return sectionId;
  }, [draft, touchDraft]);

  const handleUpdateSection = useCallback(
    (sectionId: string, patch: { title?: string; guidance?: string }) => {
      touchDraft({
        ...draft,
        sections: draft.sections.map((section) =>
          section.id === sectionId ? { ...section, ...patch } : section,
        ),
      });
    },
    [draft, touchDraft],
  );

  const handleDeleteSection = useCallback(
    (sectionId: string) => {
      if (draft.sections.length <= 1) return;
      touchDraft({
        ...draft,
        sections: draft.sections.filter((section) => section.id !== sectionId),
      });
    },
    [draft, touchDraft],
  );

  const handleAddItem = useCallback(
    (sectionId: string) => {
      setAddingItemSectionIds((prev) => [...prev, sectionId]);
      touchDraft({
        ...draft,
        sections: draft.sections.map((section) => {
          if (section.id !== sectionId) return section;
          if (section.items.length >= ESTIMATE_TEMPLATE_MAX_ITEMS_PER_SECTION) return section;
          return {
            ...section,
            items: [
              ...section.items,
              {
                id: createTemplateDraftId(),
                name: "",
                unit: "",
                unitPrice: "",
                vatRate: "",
                note: "",
                sortOrder: section.items.length,
              },
            ],
          };
        }),
      });
      setAddingItemSectionIds((prev) => prev.filter((id) => id !== sectionId));
    },
    [draft, touchDraft],
  );

  const handleUpdateItem = useCallback(
    (itemId: string, data: Partial<TemplateItemDraft>) => {
      touchDraft({
        ...draft,
        sections: draft.sections.map((section) => ({
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, ...data } : item,
          ),
        })),
      });
    },
    [draft, touchDraft],
  );

  const handleGenerationModeChange = useCallback(
    (generationMode: EstimateAiGenerationMode) => {
      touchDraft({ ...draft, generationMode });
    },
    [draft, touchDraft],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      touchDraft({
        ...draft,
        sections: draft.sections.map((section) => ({
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        })),
      });
    },
    [draft, touchDraft],
  );

  const handleReorderItems = useCallback(
    (sectionId: string, fromIndex: number, toIndex: number) => {
      touchDraft({
        ...draft,
        sections: draft.sections.map((section) => {
          if (section.id !== sectionId) return section;
          const items = [...section.items];
          const [moved] = items.splice(fromIndex, 1);
          items.splice(toIndex, 0, moved);
          return {
            ...section,
            items: items.map((item, index) => ({ ...item, sortOrder: index })),
          };
        }),
      });
    },
    [draft, touchDraft],
  );

  const handleMetadataSave = useCallback(
    async (payload: { name: string; description: string; currency: string }) => {
      touchDraft({
        ...draft,
        name: payload.name,
        description: payload.description,
        currency: payload.currency,
      });
      if (!pendingAiSave) {
        await saveNow();
      }
    },
    [draft, pendingAiSave, saveNow, touchDraft],
  );

  const isAiBlocking = aiSkeletonState !== "idle";
  const breadcrumbLabel = draft.name.trim() || null;

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={breadcrumbLabel} />
      <EstimateEditorLayoutStyles />
      <div className="mx-auto w-full max-w-7xl">
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="flex min-h-0 flex-col border-b border-border/60 lg:w-1/4 lg:max-w-1/4 lg:shrink-0 lg:border-r lg:border-b-0">
              <EstimateTemplatesSidebar
                templates={templates}
                activeTemplateId={currentTemplateId}
                defaultTemplateId={defaultTemplateId}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                locale={locale}
                access={access}
                showSystemTemplate={showSystemTemplate}
              />
            </div>

            <div className="min-w-0 flex-1 lg:w-3/4">
              <div className="space-y-6 p-3 sm:p-5 md:p-6 lg:p-8">
                <EstimateTemplateDetailHeader
                  name={draft.name}
                  description={draft.description}
                  currency={draft.currency}
                  isDefault={isDefault}
                  isNew={!currentTemplateId}
                  autosaveStatus={status}
                  pendingAiSave={pendingAiSave}
                  onSaveTemplate={handleSaveTemplate}
                  isSavingTemplate={isSavingTemplate}
                  readOnly={readOnly || isAiBlocking}
                  locale={locale}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                  templateId={currentTemplateId}
                  updatedAt={updatedAt}
                  sectionCount={countDraftSections(draft.sections)}
                  itemCount={countDraftItems(draft.sections)}
                  onMetadataSave={handleMetadataSave}
                  isKpiLoading={isAiBlocking}
                />

                {!isAiBlocking ? (
                  <TemplateEstimateGenerationModeField
                    value={draft.generationMode}
                    onChange={handleGenerationModeChange}
                    disabled={readOnly}
                  />
                ) : null}

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{tWorkspace("structureTitle")}</h3>
                  <div className={estimateEditorTabShellClass}>
                    <div className="min-w-0 overflow-hidden rounded-lg border bg-card/95 shadow-sm">
                      {isAiBlocking ? (
                        <div className="p-3 sm:p-5 md:p-6">
                          <TemplateGeneratingSkeleton
                            state={
                              aiSkeletonState === "generating"
                                ? "generating"
                                : aiSkeletonState === "prompt-missing"
                                  ? "prompt-missing"
                                  : "error"
                            }
                            errorMessage={aiErrorMessage ?? tAi("generationError")}
                            isRetryPending={isAiRetryPending}
                            onRetry={aiSkeletonState === "error" ? handleAiRetry : undefined}
                            onBackToGenerate={handleBackToGenerate}
                          />
                        </div>
                      ) : (
                        <fieldset disabled={readOnly} className="min-w-0 border-0 p-0 disabled:opacity-80">
                          <TemplateItemsView
                            sections={draft.sections}
                            currency={draft.currency}
                            advancedMode={advancedMode}
                            onAdvancedModeChange={setAdvancedMode}
                            onAddSection={handleAddSection}
                            addingItemSectionIds={addingItemSectionIds}
                            autosaveStatus={status}
                            onUpdateSection={handleUpdateSection}
                            onDeleteSection={handleDeleteSection}
                            onAddItem={handleAddItem}
                            onUpdateItem={handleUpdateItem}
                            onDeleteItem={handleDeleteItem}
                            onReorderItems={handleReorderItems}
                            onBlur={handleBlur}
                            defaultSectionsExpanded={true}
                          />
                        </fieldset>
                      )}
                    </div>
                  </div>
                </div>

                {isDefault ? <EstimateTemplateDefaultNotice /> : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
