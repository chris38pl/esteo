"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CreateEstimateModal } from "./create-estimate-modal";
import { EstimateListRow } from "./estimate-list-row";
import type { EstimateListPageItem } from "@/features/estimates/server/list-estimates-page-data";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { Locale } from "@/lib/locale";

interface EstimatesListPanelProps {
  estimates: EstimateListPageItem[];
  createFormData: PublicEstimateRequestPageData;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}

export function EstimatesListPanel({
  estimates,
  createFormData,
  workspaceId,
  workspaceSlug,
  locale,
}: EstimatesListPanelProps) {
  const t = useTranslations("estimates");
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("page.title")}</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          {t("page.newEstimate")}
        </Button>
      </div>

      {estimates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-sm">{t("page.empty")}</p>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            {t("page.createFirst")}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <div className="min-w-[20rem] divide-y">
            {estimates.map((estimate) => (
              <EstimateListRow
                key={estimate.id}
                estimate={estimate}
                workspaceSlug={workspaceSlug}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}

      <CreateEstimateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        formData={createFormData}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
      />
    </div>
  );
}
