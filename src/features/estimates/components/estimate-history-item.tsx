"use client";

import { useLocale, useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { Badge } from "@/components/ui/badge";
import type { EstimateActivityLogClient } from "@/features/estimates/lib/serialize-estimate-activity";
import {
  PAYMENT_SCHEDULE_PRESET_IDS,
  type PaymentSchedulePresetId,
} from "@/features/estimates/lib/payment-schedule-presets";
import { formatCurrency, type Currency } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimateHistoryItemProps {
  log: EstimateActivityLogClient;
}

function formatTimestamp(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const categoryBadgeVariant: Record<
  EstimateActivityLogClient["category"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  ESTIMATE: "outline",
  VERSION: "secondary",
  FINANCIAL: "default",
  AI: "secondary",
  SHARING: "outline",
};

function actorLabel(
  log: EstimateActivityLogClient,
  t: ReturnType<typeof useTranslations<"estimates">>,
): string {
  if (log.actorType === "SYSTEM") {
    return log.category === "AI" ? t("editor.history.actorAi") : t("editor.history.actorSystem");
  }
  if (log.actor) {
    return log.actor.name?.trim() || log.actor.email;
  }
  return t("editor.history.actorSystem");
}

function isPaymentPresetId(value: string | undefined): value is PaymentSchedulePresetId {
  return value != null && PAYMENT_SCHEDULE_PRESET_IDS.includes(value as PaymentSchedulePresetId);
}

function activityDescription(
  log: EstimateActivityLogClient,
  t: ReturnType<typeof useTranslations<"estimates">>,
  tPayments: ReturnType<typeof useTranslations<"estimates.editor.payments">>,
  tHistoryActions: ReturnType<typeof useTranslations<"estimates.editor.history.actions">>,
  locale: Locale,
): string {
  const meta = log.metadata;
  const currency: Currency = meta.currency ?? "PLN";

  function formatAmount(value: number | undefined): string {
    if (value == null) return "";
    return formatCurrency(value, locale, currency);
  }

  if (log.action === "estimate_created") {
    if (meta.source === "public_request") {
      return t("editor.history.actions.estimate_created_public_request");
    }
    return t("editor.history.actions.estimate_created");
  }

  if (log.action === "version_modified" && meta.source === "price_list") {
    return t("editor.history.actions.version_modified_price_list");
  }

  switch (log.action) {
    case "estimate_renamed":
      return t("editor.history.actions.estimate_renamed");
    case "version_created":
      return t("editor.history.actions.version_created", {
        versionNumber: meta.versionNumber ?? 0,
      });
    case "version_deleted":
      return t("editor.history.actions.version_deleted", {
        versionNumber: meta.versionNumber ?? 0,
      });
    case "version_archived":
      return t("editor.history.actions.version_archived", {
        versionNumber: meta.versionNumber ?? 0,
      });
    case "version_unarchived":
      return t("editor.history.actions.version_unarchived", {
        versionNumber: meta.versionNumber ?? 0,
      });
    case "version_modified":
      return t("editor.history.actions.version_modified");
    case "margin_changed":
      return t("editor.history.actions.margin_changed", {
        oldMargin: meta.oldMargin ?? 0,
        newMargin: meta.newMargin ?? 0,
      });
    case "ai_generated":
      return t("editor.history.actions.ai_generated");
    case "ai_modified":
      return t("editor.history.actions.ai_modified");
    case "imported_from_price_list":
      return t("editor.history.actions.imported_from_price_list");
    case "estimate_exported":
      return t("editor.history.actions.estimate_exported");
    case "sent_to_customer":
      return t("editor.history.actions.sent_to_customer", {
        email: meta.email ?? "",
      });
    case "estimate_resent":
      return t("editor.history.actions.estimate_resent", {
        email: meta.email ?? "",
      });
    case "estimate_accepted":
      return t("editor.history.actions.estimate_accepted");
    case "estimate_rejected":
      return t("editor.history.actions.estimate_rejected");
    case "estimate_reopened":
      return t("editor.history.actions.estimate_reopened");
    case "payment_installment_added":
      return t("editor.history.actions.payment_installment_added", {
        name: meta.installmentName ?? "",
        amount: formatAmount(meta.installmentAmount),
      });
    case "payment_installment_updated":
      return t("editor.history.actions.payment_installment_updated", {
        name: meta.installmentName ?? "",
      });
    case "payment_installment_deleted":
      return t("editor.history.actions.payment_installment_deleted", {
        name: meta.installmentName ?? "",
      });
    case "payment_schedule_generated": {
      const preset = isPaymentPresetId(meta.presetId)
        ? tPayments(`presets.${meta.presetId}`)
        : meta.presetId ?? "";
      return t("editor.history.actions.payment_schedule_generated", { preset });
    }
    case "payment_installment_reordered":
      return t("editor.history.actions.payment_installment_reordered");
    case "payment_recorded":
      return t("editor.history.actions.payment_recorded", {
        name: meta.installmentName ?? "",
        amount: formatAmount(meta.paymentAmount),
      });
    case "payment_installment_unpaid":
      return t("editor.history.actions.payment_installment_unpaid", {
        name: meta.installmentName ?? "",
      });
    case "note_added":
      return t("editor.history.actions.note_added");
    case "note_replied":
      return t("editor.history.actions.note_replied");
    case "note_deleted":
      if (meta.replyCount != null && meta.replyCount > 0) {
        return t("editor.history.actions.note_deleted_with_replies", {
          count: meta.replyCount,
        });
      }
      return t("editor.history.actions.note_deleted");
    case "attachment_added":
      if (meta.fileCount != null && meta.fileCount > 1) {
        return tHistoryActions("attachment_added_multiple", {
          count: meta.fileCount,
        });
      }
      return tHistoryActions("attachment_added", {
        fileName: meta.fileName ?? "",
      });
    case "attachment_deleted":
      return tHistoryActions("attachment_deleted", {
        fileName: meta.fileName ?? "",
      });
    default:
      return log.action;
  }
}

function categoryLabel(
  log: EstimateActivityLogClient,
  t: ReturnType<typeof useTranslations<"estimates">>,
): string {
  switch (log.category) {
    case "ESTIMATE":
      return t("editor.history.categories.estimate");
    case "VERSION":
      return t("editor.history.categories.version");
    case "FINANCIAL":
      return t("editor.history.categories.financial");
    case "AI":
      return t("editor.history.categories.ai");
    case "SHARING":
      return t("editor.history.categories.sharing");
    default:
      return log.category;
  }
}

export function EstimateHistoryItem({ log }: EstimateHistoryItemProps) {
  const t = useTranslations("estimates");
  const tPayments = useTranslations("estimates.editor.payments");
  const tHistoryActions = useTranslations("estimates.editor.history.actions");
  const locale = useLocale() as Locale;
  const description = activityDescription(log, t, tPayments, tHistoryActions, locale);
  const label = actorLabel(log, t);

  return (
    <div className="flex gap-3 py-3">
      {log.actorType === "USER" && log.actor ? (
        <UserAvatar
          imageUrl={log.actor.avatarUrl}
          avatarPreset={log.actor.avatarPreset}
          size={36}
          className="mt-0.5 shrink-0"
        />
      ) : (
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
            log.category === "AI" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
          aria-hidden
        >
          <span className="text-[10px] font-semibold uppercase">
            {log.category === "AI" ? "AI" : "S"}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <time className="text-muted-foreground" dateTime={log.occurredAt}>
            {formatTimestamp(log.occurredAt, locale)}
          </time>
          <Badge variant={categoryBadgeVariant[log.category]} className="text-xs">
            {categoryLabel(log, t)}
          </Badge>
        </div>
        <p className="text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground"> - </span>
          <span>{description}</span>
        </p>
      </div>
    </div>
  );
}
