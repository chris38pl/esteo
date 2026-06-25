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
import { useTemplateAutosave } from "@/features/estimate-templates/hooks/use-template-autosave";
import {
  PriceListDefaultNotice,
  PriceListDetailHeader,
} from "@/features/price-lists/components/price-list-detail-header";
import { PriceListItemsView } from "@/features/price-lists/components/price-list-items-view";
import { PriceListsSidebar } from "@/features/price-lists/components/price-lists-sidebar";
import {
  buildPriceListPayload,
  countDraftPriceListItems,
  createPriceListDraftId,
  isPriceListDraftSavable,
  mergePriceListDraftAfterSave,
  priceListToEditorDraft,
  type PriceListEditorDraft,
  type PriceListItemDraft,
} from "@/features/price-lists/lib/price-list-editor-draft";
import { PRICE_LIST_MAX_ITEMS } from "@/features/price-lists/lib/price-list-limits";
import {
  createPriceListAction,
  updatePriceListAction,
} from "@/features/workspace-configuration/server/actions";
import type {
  ConfigurationAccess,
  SerializedPriceListListItem,
} from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface PriceListEditorProps {
  priceListId: string | null;
  initialDraft: PriceListEditorDraft;
  initialUpdatedAt?: string | null;
  priceLists: SerializedPriceListListItem[];
  defaultPriceListId: string | null;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  access: ConfigurationAccess;
}

export function PriceListEditor({
  priceListId,
  initialDraft,
  initialUpdatedAt = null,
  priceLists,
  defaultPriceListId,
  workspaceId,
  workspaceSlug,
  locale,
  access,
}: PriceListEditorProps) {
  const tWorkspace = useTranslations("workspaces.configuration.priceLists.workspace");
  const router = useRouter();
  const readOnly = !access.canEditPremiumConfiguration;
  const [draft, setDraft] = useState<PriceListEditorDraft>(initialDraft);
  const [currentPriceListId, setCurrentPriceListId] = useState<string | null>(priceListId);
  const [updatedAt, setUpdatedAt] = useState<string | null>(initialUpdatedAt);
  const draftRef = useRef(initialDraft);
  const currentPriceListIdRef = useRef(priceListId);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    currentPriceListIdRef.current = currentPriceListId;
  }, [currentPriceListId]);

  const isDefault = Boolean(currentPriceListId && currentPriceListId === defaultPriceListId);

  const persistDraft = useCallback(async (): Promise<boolean> => {
    if (!isPriceListDraftSavable(draftRef.current)) {
      return true;
    }

    const payload = buildPriceListPayload(draftRef.current);
    const activePriceListId = currentPriceListIdRef.current;

    if (activePriceListId) {
      const result = await updatePriceListAction(
        {
          workspaceId,
          workspaceSlug,
          priceListId: activePriceListId,
          priceList: payload,
        },
        locale,
      );
      if (!result.success) {
        appToast.error(result.error);
        return false;
      }

      const nextDraft = mergePriceListDraftAfterSave(
        priceListToEditorDraft(result.data),
        draftRef.current,
      );
      setDraft(nextDraft);
      draftRef.current = nextDraft;
      setUpdatedAt(result.data.updatedAt);
      router.refresh();
      return true;
    }

    const result = await createPriceListAction(
      { workspaceId, workspaceSlug, priceList: payload },
      locale,
    );
    if (!result.success) {
      appToast.error(result.error);
      return false;
    }

    currentPriceListIdRef.current = result.data.id;
    setCurrentPriceListId(result.data.id);
    setUpdatedAt(result.data.updatedAt);
    router.replace(
      `/${locale}/dashboard/${workspaceSlug}/configuration/price-lists/${result.data.id}`,
    );
    return true;
  }, [locale, router, workspaceId, workspaceSlug]);

  const { status, scheduleSave, saveNow } = useTemplateAutosave({
    enabled: !readOnly,
    canSave: isPriceListDraftSavable(draft),
    getCanSave: () => isPriceListDraftSavable(draftRef.current),
    onSave: persistDraft,
  });

  const touchDraft = useCallback(
    (next: PriceListEditorDraft) => {
      setDraft(next);
      scheduleSave();
    },
    [scheduleSave],
  );

  const handleMetadataSave = useCallback(
    async (payload: { name: string; currency: string }) => {
      touchDraft({ ...draft, name: payload.name, currency: payload.currency });
      await saveNow();
    },
    [draft, saveNow, touchDraft],
  );

  const handleBlur = useCallback(async () => {
    await saveNow();
  }, [saveNow]);

  const handleAddItem = useCallback(() => {
    if (draft.items.length >= PRICE_LIST_MAX_ITEMS) return;
    const next: PriceListEditorDraft = {
      ...draft,
      items: [
        ...draft.items,
        {
          id: createPriceListDraftId(),
          name: "",
          unit: "",
          unitPrice: "",
          vatRate: "",
          note: "",
          sortOrder: draft.items.length,
        },
      ],
    };
    setDraft(next);
    draftRef.current = next;
  }, [draft]);

  const handleUpdateItem = useCallback(
    (itemId: string, data: Partial<PriceListItemDraft>) => {
      touchDraft({
        ...draft,
        items: draft.items.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
      });
    },
    [draft, touchDraft],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (draft.items.length <= 1) return;
      touchDraft({
        ...draft,
        items: draft.items.filter((item) => item.id !== itemId),
      });
    },
    [draft, touchDraft],
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
              <PriceListsSidebar
                priceLists={priceLists}
                activePriceListId={currentPriceListId}
                defaultPriceListId={defaultPriceListId}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                locale={locale}
                access={access}
              />
            </div>

            <div className="min-w-0 flex-1 lg:w-[70%]">
              <div className="space-y-6 p-5 md:p-6 lg:p-8">
                <PriceListDetailHeader
                  name={draft.name}
                  currency={draft.currency}
                  isDefault={isDefault}
                  isNew={!currentPriceListId}
                  autosaveStatus={status}
                  readOnly={readOnly}
                  locale={locale}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                  priceListId={currentPriceListId}
                  updatedAt={updatedAt}
                  itemCount={countDraftPriceListItems(draft)}
                  onMetadataSave={handleMetadataSave}
                />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">{tWorkspace("structureTitle")}</h3>
                  <div className={cn(estimateEditorTabShellClass, estimateEditorTabShellNarrowClass)}>
                    <div className="min-w-0 overflow-hidden rounded-lg border bg-card/95 shadow-sm">
                      <fieldset disabled={readOnly} className="min-w-0 border-0 p-0 disabled:opacity-80">
                        <PriceListItemsView
                          items={draft.items}
                          readOnly={readOnly}
                          autosaveStatus={status}
                          onAddItem={handleAddItem}
                          onUpdateItem={handleUpdateItem}
                          onDeleteItem={handleDeleteItem}
                          onBlur={handleBlur}
                        />
                      </fieldset>
                    </div>
                  </div>
                </div>

                {isDefault ? <PriceListDefaultNotice /> : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
