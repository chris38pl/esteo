"use client";

import { Building2, CalendarClock, FileText, User } from "lucide-react";
import { useTranslations } from "next-intl";

import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface EstimateContextCardsProps {
  requestNumber?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  investmentPropertyType?: string | null;
  investmentStreet?: string | null;
  investmentCity?: string | null;
  requestCreatedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  updatedByEmail?: string | null;
  locale: Locale;
}

const iconClassName =
  "flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10";

export function EstimateContextCards({
  requestNumber,
  customerName,
  customerEmail,
  investmentPropertyType,
  investmentStreet,
  investmentCity,
  requestCreatedAt,
  updatedAt,
  updatedByEmail,
  locale,
}: EstimateContextCardsProps) {
  const t = useTranslations("estimates");
  const dateLocale = locale === "pl" ? "pl-PL" : "en-US";

  const formatDate = (value: string | Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));

  const formatDateTime = (value: string | Date) =>
    new Intl.DateTimeFormat(dateLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));

  const cards = [
    {
      key: "request",
      icon: FileText,
      heading: t("context.request"),
      primary: requestNumber ?? t("context.empty"),
      secondary: requestCreatedAt
        ? t("context.createdOn", { date: formatDate(requestCreatedAt) })
        : t("context.noDate"),
    },
    {
      key: "investment",
      icon: Building2,
      heading: t("context.investment"),
      primary: investmentPropertyType ?? t("context.investmentFallback"),
      secondary: [investmentStreet, investmentCity].filter(Boolean).join(", ") || t("context.noAddress"),
    },
    {
      key: "client",
      icon: User,
      heading: t("context.client"),
      primary: customerName ?? customerEmail ?? t("context.empty"),
      secondary: customerName && customerEmail ? customerEmail : t("context.noEmail"),
    },
    {
      key: "updated",
      icon: CalendarClock,
      heading: t("context.lastUpdated"),
      primary: updatedAt ? formatDateTime(updatedAt) : t("context.noDate"),
      secondary: t("context.editedBy", {
        user: updatedByEmail ?? t("context.system"),
      }),
    },
  ];

  return (
    <section className="flex h-full min-h-[8.75rem] min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
      <div className="estimate-context-grid">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.key}
              className={cn(
                "flex min-w-0 items-center gap-3 px-5 py-4",
                "bg-card/95",
              )}
            >
              <span className={iconClassName}>
                <Icon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  {card.heading}
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-foreground">
                  {card.primary}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {card.secondary}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
