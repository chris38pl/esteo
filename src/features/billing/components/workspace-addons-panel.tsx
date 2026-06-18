"use client";

import { useState, useTransition } from "react";
import { ArrowLeft, Loader2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { WorkspaceBillingAddonsPageData } from "@/features/billing/billing-addons-page-data";
import type { BillingChangePreview } from "@/features/billing/billing-page-data";
import { BillingChangePreviewDialog } from "@/features/billing/components/billing-change-preview-dialog";
import { BillingCreditConfirmDialog } from "@/features/billing/components/billing-credit-confirm-dialog";
import { isBillingPreviewExpired } from "@/features/billing/lib/billing-preview-utils";
import {
  changeWorkspaceAddonQuantityAction,
  previewWorkspaceBillingChangeAction,
} from "@/features/billing/server/billing-actions";
import {
  ADDON_UNIT_PRICES_PLN,
  MAX_ADDON_QUANTITY,
  SEAT_UNIT_COUNT,
  STORAGE_UNIT_BYTES,
} from "@/server/billing/addon-catalog";
import {
  dashboardBillingHref,
  dashboardBillingPlansHref,
  dashboardUpgradeHref,
} from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

type Props = {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  data: WorkspaceBillingAddonsPageData;
  canManageBilling: boolean;
};

function formatGb(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 10 || Number.isInteger(gb)) {
    return `${gb.toFixed(gb >= 10 ? 0 : 1)} GB`;
  }
  return `${gb.toFixed(1)} GB`;
}

export function WorkspaceAddonsPanel({
  workspaceId,
  workspaceSlug,
  locale,
  data,
  canManageBilling,
}: Props) {
  const t = useTranslations("billing.workspace.addonPage");
  const billingHref = dashboardBillingHref(locale, workspaceSlug);
  const plansHref = dashboardBillingPlansHref(locale, workspaceSlug);
  const businessPlansHref = dashboardUpgradeHref(locale, workspaceSlug, { plan: "BUSINESS" });

  const { entitlements } = data;
  const plan = entitlements.plan;
  const isFree = plan === "FREE";
  const isBusiness = plan === "BUSINESS";
  const canBuyStorage = plan === "PRO" || plan === "BUSINESS";

  const [storageQty, setStorageQty] = useState(entitlements.addons.storage.quantity);
  const [seatQty, setSeatQty] = useState(entitlements.addons.seats.quantity);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<BillingChangePreview | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);

  const baseStorage = entitlements.baseLimits.maxStorageBytes;
  const baseSeats = entitlements.baseLimits.maxInvitedSeats ?? 0;
  const baseUsers = baseSeats + 1;
  const storageExtra = storageQty * STORAGE_UNIT_BYTES;
  const totalStorage = baseStorage + storageExtra;
  const seatExtra = seatQty * SEAT_UNIT_COUNT;
  const totalUsers = baseUsers + seatExtra;

  const storageDirty = storageQty !== entitlements.addons.storage.quantity;
  const seatDirty = seatQty !== entitlements.addons.seats.quantity;
  const isDirty = storageDirty || seatDirty;

  const storageMonthly = storageQty * ADDON_UNIT_PRICES_PLN.STORAGE;
  const seatMonthly = seatQty * ADDON_UNIT_PRICES_PLN.SEATS;

  async function applyAddonChanges() {
    if (storageDirty && canBuyStorage) {
      const result = await changeWorkspaceAddonQuantityAction(
        workspaceId,
        "STORAGE",
        storageQty,
      );
      if (!result.success) {
        setError(result.error);
        return false;
      }
    }

    if (seatDirty && isBusiness) {
      const result = await changeWorkspaceAddonQuantityAction(workspaceId, "SEATS", seatQty);
      if (!result.success) {
        setError(result.error);
        return false;
      }
    }

    return true;
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const previewResult = await previewWorkspaceBillingChangeAction(workspaceId, {
        kind: "addons",
        storageQuantity: storageQty,
        seatQuantity: seatQty,
      });

      if (!previewResult.success) {
        setError(previewResult.error);
        return;
      }

      const nextPreview = previewResult.data;
      setPreview(nextPreview);

      if (nextPreview.prorationKind === "charge") {
        setPreviewDialogOpen(true);
        return;
      }

      if (nextPreview.prorationKind === "credit") {
        setCreditDialogOpen(true);
        return;
      }

      const ok = await applyAddonChanges();
      if (ok) {
        toast.success(t("saveSuccess"));
        window.location.reload();
      }
    });
  }

  function handleConfirmPreview() {
    if (!preview || isBillingPreviewExpired(preview)) {
      return;
    }

    startTransition(async () => {
      setPreviewDialogOpen(false);
      setCreditDialogOpen(false);
      const ok = await applyAddonChanges();
      if (ok) {
        toast.success(t("saveSuccess"));
        window.location.reload();
      }
    });
  }

  function handleRecalculatePreview() {
    setPreviewDialogOpen(false);
    setCreditDialogOpen(false);
    handleSave();
  }

  const previewExpired = isBillingPreviewExpired(preview);

  if (isFree) {
    return (
      <div className="space-y-6">
        <Header billingHref={billingHref} title={t("title")} subtitle={t("subtitle")} />
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <p className="text-sm text-muted-foreground">{t("freeGate")}</p>
          <Button asChild className="mt-4">
            <Link href={plansHref}>{t("viewPlans")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header billingHref={billingHref} title={t("title")} subtitle={t("subtitle")} />

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {canBuyStorage ? (
        <AddonStepperSection
          title={t("storage.title")}
          summary={t("storage.summary", {
            base: formatGb(baseStorage),
            extra: formatGb(storageExtra),
            total: formatGb(totalStorage),
          })}
          packLabel={t("storage.packLabel", { count: storageQty, amount: formatGb(storageExtra) })}
          priceLabel={t("storage.price", {
            total: storageMonthly,
            unit: ADDON_UNIT_PRICES_PLN.STORAGE,
          })}
          quantity={storageQty}
          max={MAX_ADDON_QUANTITY.STORAGE}
          disabled={pending || !canManageBilling}
          onChange={setStorageQty}
        />
      ) : null}

      {isBusiness ? (
        <AddonStepperSection
          title={t("seats.title")}
          summary={t("seats.summary", {
            base: baseUsers,
            extra: seatExtra,
            total: totalUsers,
          })}
          packLabel={t("seats.packLabel", { count: seatQty, amount: seatExtra })}
          priceLabel={t("seats.price", {
            total: seatMonthly,
            unit: ADDON_UNIT_PRICES_PLN.SEATS,
          })}
          quantity={seatQty}
          max={MAX_ADDON_QUANTITY.SEATS}
          disabled={pending || !canManageBilling}
          onChange={setSeatQty}
        />
      ) : (
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-semibold tracking-tight">{t("seats.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("seats.proUpsell")}</p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={businessPlansHref}>{t("seats.viewBusiness")}</Link>
          </Button>
        </section>
      )}

      {canManageBilling ? (
        <div className="space-y-3">
          {isDirty ? (
            <p className="text-sm text-muted-foreground">{t("prorationNotice")}</p>
          ) : null}
          <div className="flex justify-end">
            <Button className="min-w-[160px]" disabled={!isDirty || pending} onClick={handleSave}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("save")}
            </Button>
          </div>
        </div>
      ) : null}

      <BillingChangePreviewDialog
        open={previewDialogOpen}
        preview={preview}
        locale={locale}
        pending={pending}
        expired={previewExpired}
        onOpenChange={setPreviewDialogOpen}
        onConfirm={handleConfirmPreview}
        onRecalculate={handleRecalculatePreview}
      />
      <BillingCreditConfirmDialog
        open={creditDialogOpen}
        preview={preview}
        locale={locale}
        pending={pending}
        expired={previewExpired}
        onOpenChange={setCreditDialogOpen}
        onConfirm={handleConfirmPreview}
        onRecalculate={handleRecalculatePreview}
      />
    </div>
  );
}

function Header({
  billingHref,
  title,
  subtitle,
}: {
  billingHref: string;
  title: string;
  subtitle: string;
}) {
  const t = useTranslations("billing.workspace.addonPage");

  return (
    <header className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href={billingHref}>
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToBilling")}
        </Link>
      </Button>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </header>
  );
}

function AddonStepperSection({
  title,
  summary,
  packLabel,
  priceLabel,
  quantity,
  max,
  disabled,
  onChange,
}: {
  title: string;
  summary: string;
  packLabel: string;
  priceLabel: string;
  quantity: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("billing.workspace.addonPage");

  return (
    <section className="rounded-xl border border-border/60 bg-card p-6">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{summary}</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            disabled={disabled || quantity <= 0}
            onClick={() => onChange(Math.max(0, quantity - 1))}
            aria-label={t("decrease")}
          >
            <Minus className="size-4" />
          </Button>
          <div className="min-w-[140px] text-center">
            <p className="text-sm font-medium">{packLabel}</p>
            <p className="text-xs text-muted-foreground">{priceLabel}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9"
            disabled={disabled || quantity >= max}
            onClick={() => onChange(Math.min(max, quantity + 1))}
            aria-label={t("increase")}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
