"use client";

import { useLocale, useTranslations } from "next-intl";

import type { EstimateVersionWorkflowClient } from "@/features/estimates/lib/serialize-estimate-version-workflow";
import { cn } from "@/lib/utils";

function formatSendDateTime(value: string, dateLocale: string): string {
  return new Intl.DateTimeFormat(dateLocale === "pl" ? "pl-PL" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EstimateSendMetaLines({
  workflow,
  layout = "stacked",
  className,
}: {
  workflow: EstimateVersionWorkflowClient;
  layout?: "stacked" | "inline";
  className?: string;
}) {
  const t = useTranslations("estimates");
  const dateLocale = useLocale();

  if (workflow.successfulSendCount === 0 && !workflow.lastSentAt) {
    return null;
  }

  const items: string[] = [];

  if (workflow.successfulSendCount > 0) {
    items.push(t("header.sendMeta.count", { count: workflow.successfulSendCount }));
  }

  if (workflow.lastSentAt) {
    items.push(
      t("header.sendMeta.lastSent", {
        date: formatSendDateTime(workflow.lastSentAt, dateLocale),
      }),
    );
  }

  if (workflow.lastSentToEmail) {
    items.push(t("header.sendMeta.to", { email: workflow.lastSentToEmail }));
  }

  if (layout === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
        {items.map((item, index) => (
          <span key={index} className="inline-flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden className="text-blue-500/50 dark:text-blue-200/40">
                ·
              </span>
            ) : null}
            <span>{item}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}
