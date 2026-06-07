"use client";

import { useTranslations } from "next-intl";

import type { EstimateActivityLogClient } from "@/features/estimates/lib/serialize-estimate-activity";

import { EstimateHistoryItem } from "./estimate-history-item";

interface EstimateHistoryPanelProps {
  initialLogs: EstimateActivityLogClient[];
}

export function EstimateHistoryPanel({ initialLogs }: EstimateHistoryPanelProps) {
  const t = useTranslations("estimates");

  if (initialLogs.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        {t("editor.history.empty")}
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <ul className="divide-y divide-border/60">
        {initialLogs.map((log) => (
          <li key={log.id}>
            <EstimateHistoryItem log={log} />
          </li>
        ))}
      </ul>
    </div>
  );
}
