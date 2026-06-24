"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { appToast } from "@/components/ui/app-toast";

import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import { EstimateEditorLayoutStyles } from "@/features/estimates/components/estimate-editor-layout-styles";
import {
  estimateEditorTabShellClass,
  estimateEditorTabShellNarrowClass,
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
import {
  buildTemplatePayload,
  createTemplateDraftId,
  isTemplateDraftSavable,
  type TemplateEditorDraft,
} from "@/features/estimate-templates/lib/template-editor-draft";
import {
  createEstimateTemplateAction,
  updateEstimateTemplateAction,
} from "@/features/workspace-configuration/server/actions";
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
}: EstimateTemplateEditorProps) {
  const tWorkspace = useTranslations("workspaces.configuration.templates.workspace");
  const router = useRouter();
  const readOnly = !access.canEditPremiumConfiguration;
  const [draft, setDraft] = useState<TemplateEditorDraft>(initialDraft);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(templateId);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const [addingItemSectionIds, setAddingItemSectionIds] = useState<string[]>([]);
  const draftRef = useRef(initialDraft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  const { advancedMode, setAdvancedMode } = useTemplateAdvancedMode();
  const isDefault = Boolean(currentTemplateId && currentTemplateId === defaultTemplateId);

  const persistDraft = useCallback(async (): Promise<boolean> => {
    const payload = buildTemplatePayload(draftRef.current);
    if (!isTemplateDraftSavable(draftRef.current)) {
      return false;
    }

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
    setUpdatedAt(result.data.updatedAt);
    router.replace(
      `/${locale}/dashboard/${workspaceSlug}/configuration/templates/${result.data.id}`,
    );
    return true;
  }, [currentTemplateId, locale, router, workspaceId, workspaceSlug]);

  const { status, scheduleSave, saveNow } = useTemplateAutosave({
    enabled: !readOnly,
    canSave: isTemplateDraftSavable(draft),
    onSave: persistDraft,
  });

  const touchDraft = useCallback(
    (next: TemplateEditorDraft) => {
      setDraft(next);
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleBlur = useCallback(async () => {
    await saveNow();
  }, [saveNow]);

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
          items: [{ id: createTemplateDraftId(), name: "", unit: "", sortOrder: 0 }],
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
    (itemId: string, data: Partial<{ name: string; unit: string }>) => {
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
    async (payload: { name: string; description: string }) => {
      touchDraft({ ...draft, name: payload.name, description: payload.description });
      await saveNow();
    },
    [draft, saveNow, touchDraft],
  );

  const breadcrumbLabel = draft.name.trim() || null;

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={breadcrumbLabel} />
      <EstimateEditorLayoutStyles />
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="flex min-h-0 flex-col border-b border-border/60 lg:w-[30%] lg:max-w-[30%] lg:shrink-0 lg:border-r lg:border-b-0">
              <EstimateTemplatesSidebar
                templates={templates}
                activeTemplateId={currentTemplateId}
                defaultTemplateId={defaultTemplateId}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                locale={locale}
                access={access}
              />
            </div>

            <div className="min-w-0 flex-1 lg:w-[70%]">
              <div className="space-y-6 p-5 md:p-6 lg:p-8">
                <EstimateTemplateDetailHeader
                  name={draft.name}
                  description={draft.description}
                  isDefault={isDefault}
                  isNew={!currentTemplateId}
                  autosaveStatus={status}
                  readOnly={readOnly}
                  locale={locale}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                  templateId={currentTemplateId}
                  updatedAt={updatedAt}
                  sectionCount={countDraftSections(draft.sections)}
                  itemCount={countDraftItems(draft.sections)}
                  onMetadataSave={handleMetadataSave}
                />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{tWorkspace("structureTitle")}</h3>
                  <div className={cn(estimateEditorTabShellClass, estimateEditorTabShellNarrowClass)}>
                    <div className="min-w-0 overflow-hidden rounded-lg border bg-card/95 shadow-sm">
                      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0 disabled:opacity-80">
                        <TemplateItemsView
                          sections={draft.sections}
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
