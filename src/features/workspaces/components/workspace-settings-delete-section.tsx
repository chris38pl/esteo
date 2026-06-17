"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DeleteWorkspaceDialog } from "@/features/workspaces/components/delete-workspace-dialog";
import type { WorkspaceDeleteEligibility } from "@/features/workspaces/lib/workspace-delete-eligibility";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

export function WorkspaceSettingsDeleteSection({
  workspaceId,
  workspaceName,
  locale,
  workspaceSlug,
  deleteEligibility,
}: {
  workspaceId: string;
  workspaceName: string;
  locale: Locale;
  workspaceSlug: string;
  deleteEligibility: WorkspaceDeleteEligibility;
}) {
  const t = useTranslations("workspaces.settings.delete");
  const [dialogOpen, setDialogOpen] = useState(false);

  const blockedReason = deleteEligibility.allowed ? null : deleteEligibility.blockReason;

  return (
    <>
      <div className="mt-10 border-t border-border/60 pt-8">
        <h2 className="text-base font-semibold tracking-tight text-destructive">
          {t("sectionTitle")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("sectionDescription")}</p>

        {blockedReason ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-4">
            <p className="text-sm text-muted-foreground">{t(`blocked.${blockedReason}`)}</p>

            <div className="flex flex-wrap gap-2">
              {blockedReason === "CANCEL_SUBSCRIPTION_REQUIRED" ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={dashboardBillingHref(locale, workspaceSlug)}>
                    {t("openBilling")}
                  </Link>
                </Button>
              ) : null}

              {blockedReason === "PENDING_TRANSFER_EXISTS" ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/dashboard/${workspaceSlug}/settings#workspace-transfer`}>
                    {t("cancelTransfer")}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="destructive"
            className="mt-4 rounded-lg"
            onClick={() => setDialogOpen(true)}
          >
            {t("deleteButton")}
          </Button>
        )}
      </div>

      <DeleteWorkspaceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={workspaceId}
        workspaceName={workspaceName}
        locale={locale}
      />
    </>
  );
}
