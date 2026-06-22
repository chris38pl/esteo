"use client";

import { ArrowRightLeft } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type {
  PendingOutboundTransferView,
  TransferEligibilityView,
} from "@/features/workspaces/components/transfer-types";
import { WorkspaceSettingsSubscriptionRequiredWarning } from "@/features/workspaces/components/workspace-settings-subscription-required-warning";
import { WorkspaceTransferWizard } from "@/features/workspaces/components/workspace-transfer-wizard";
import { cancelWorkspaceOwnershipTransferAction } from "@/features/workspaces/server/actions";
import { dashboardBillingHref } from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

export function WorkspaceSettingsTransferSection({
  workspaceId,
  workspaceName,
  workspaceSlug,
  eligibility,
  pendingTransfer,
  locale,
  embedded = false,
}: {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  eligibility: TransferEligibilityView;
  pendingTransfer: PendingOutboundTransferView | null;
  locale: Locale;
  embedded?: boolean;
}) {
  const t = useTranslations("workspaces.settings.transfer");
  const tSubscriptionBlock = useTranslations("workspaces.settings.subscriptionBlock");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const periodEndLabel = eligibility.currentPeriodEnd
    ? new Date(eligibility.currentPeriodEnd).toLocaleDateString(
        locale === "pl" ? "pl-PL" : "en-US",
        { dateStyle: "long" },
      )
    : null;

  function handleCancelPending() {
    setError(null);

    startTransition(async () => {
      const result = await cancelWorkspaceOwnershipTransferAction(workspaceId, locale);

      if (!result.success) {
        setError(result.error);
        return;
      }

      window.location.reload();
    });
  }

  const blockMessage = eligibility.blockReason
    ? t(`blocked.${eligibility.blockReason}`)
    : null;

  return (
    <>
      <div
        id="workspace-transfer"
        className={embedded ? "space-y-4" : "mt-10 border-t border-border/60 pt-8"}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-muted/50 p-2">
            <ArrowRightLeft className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-semibold tracking-tight">{t("sectionTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("sectionDescription")}</p>
          </div>
        </div>

        {pendingTransfer ? (
          <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-4">
            <p className="text-sm font-medium">{t("pendingTitle")}</p>
            <p className="text-sm text-muted-foreground">
              {t("pendingDescription", { email: pendingTransfer.toEmail })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("pendingExpires", {
                date: new Date(pendingTransfer.expiresAt).toLocaleDateString(
                  locale === "pl" ? "pl-PL" : "en-US",
                  { dateStyle: "medium" },
                ),
              })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelPending}
              disabled={isPending}
            >
              {isPending ? t("cancelling") : t("cancelPending")}
            </Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : eligibility.eligible ? (
          <div className="mt-4 space-y-3">
            {periodEndLabel ? (
              <p className="text-sm text-muted-foreground">
                {t("eligibleHint", { date: periodEndLabel })}
              </p>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setWizardOpen(true)}>
              {t("startButton")}
            </Button>
          </div>
        ) : eligibility.blockReason === "CANCEL_SUBSCRIPTION_REQUIRED" ? (
          <WorkspaceSettingsSubscriptionRequiredWarning
            title={tSubscriptionBlock("title")}
            description={t("blocked.CANCEL_SUBSCRIPTION_REQUIRED")}
            activeUntilLabel={tSubscriptionBlock("activeUntilLabel")}
            periodEndLabel={periodEndLabel}
            ctaLabel={t("openBilling")}
            ctaHref={dashboardBillingHref(locale, workspaceSlug)}
          />
        ) : (
          <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-4">
            {blockMessage ? (
              <p className="text-sm text-muted-foreground">{blockMessage}</p>
            ) : null}
          </div>
        )}
      </div>

      {eligibility.eligible && !pendingTransfer ? (
        <WorkspaceTransferWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          eligibility={eligibility}
          locale={locale}
        />
      ) : null}
    </>
  );
}
