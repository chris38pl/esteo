"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DeleteWorkspaceDialog } from "@/features/workspaces/components/delete-workspace-dialog";
import { WorkspaceSettingsSubscriptionRequiredWarning } from "@/features/workspaces/components/workspace-settings-subscription-required-warning";
import type { WorkspaceDeleteEligibility } from "@/features/workspaces/lib/workspace-delete-eligibility";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

export function WorkspaceSettingsDeleteSection({
  workspaceId,
  workspaceName,
  locale,
  workspaceSlug,
  deleteEligibility,
  currentPeriodEnd = null,
  embedded = false,
}: {
  workspaceId: string;
  workspaceName: string;
  locale: Locale;
  workspaceSlug: string;
  deleteEligibility: WorkspaceDeleteEligibility;
  currentPeriodEnd?: string | null;
  embedded?: boolean;
}) {
  const t = useTranslations("workspaces.settings.delete");
  const tSubscriptionBlock = useTranslations("workspaces.settings.subscriptionBlock");
  const [dialogOpen, setDialogOpen] = useState(false);

  const blockedReason = deleteEligibility.allowed ? null : deleteEligibility.blockReason;

  const periodEndLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US", {
        dateStyle: "long",
      })
    : null;

  return (
    <>
      <div className={embedded ? "space-y-4" : "mt-10 border-t border-border/60 pt-8"}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-muted/50 p-2">
            <Trash2 className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">{t("sectionTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("sectionDescription")}</p>
          </div>
        </div>

        {blockedReason ? (
          blockedReason === "CANCEL_SUBSCRIPTION_REQUIRED" ? (
            <WorkspaceSettingsSubscriptionRequiredWarning
              title={tSubscriptionBlock("title")}
              description={t("blocked.CANCEL_SUBSCRIPTION_REQUIRED")}
              activeUntilLabel={tSubscriptionBlock("activeUntilLabel")}
              periodEndLabel={periodEndLabel}
              ctaLabel={t("openBilling")}
              ctaHref={dashboardBillingHref(locale, workspaceSlug)}
            />
          ) : (
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-4">
              <p className="text-sm text-muted-foreground">{t(`blocked.${blockedReason}`)}</p>

              {blockedReason === "PENDING_TRANSFER_EXISTS" ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <Link href={`/${locale}/dashboard/${workspaceSlug}/settings#workspace-transfer`}>
                    {t("cancelTransfer")}
                  </Link>
                </Button>
              ) : null}
            </div>
          )
        ) : (
          <Button
            type="button"
            variant="destructive"
            className="rounded-lg"
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
