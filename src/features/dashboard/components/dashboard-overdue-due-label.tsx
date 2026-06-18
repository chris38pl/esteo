"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { formatRelativeAgo } from "@/features/dashboard/lib/format-relative-ago";
import { formatDate } from "@/i18n/formatters";
import type { Locale } from "@/lib/locale";

export function DashboardOverdueDueLabel({
  dueDate,
  locale,
}: {
  dueDate: string;
  locale: Locale;
}) {
  const t = useTranslations("dashboard.overview.overdueList");
  const [ago, setAgo] = useState("");

  useEffect(() => {
    setAgo(formatRelativeAgo(locale, dueDate));
  }, [dueDate, locale]);

  return (
    <p
      suppressHydrationWarning
      className="mt-1 text-xs text-amber-600 dark:text-amber-400"
    >
      {t("due", {
        date: formatDate(dueDate, locale, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
        ago: ago || "\u00a0",
      })}
    </p>
  );
}
