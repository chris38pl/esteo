"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import type { IssueActivityLogClient } from "@/features/issues/lib/serialize-issue-activity";

import { IssueHistoryItem } from "./issue-history-item";

const INITIAL_VISIBLE_HISTORY = 8;

interface IssueHistoryPanelProps {
  initialLogs: IssueActivityLogClient[];
}

export function IssueHistoryPanel({ initialLogs }: IssueHistoryPanelProps) {
  const t = useTranslations("issues");
  const [showOlder, setShowOlder] = useState(false);

  if (initialLogs.length === 0) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground">
        {t("admin.history.empty")}
      </div>
    );
  }

  const hiddenCount = Math.max(0, initialLogs.length - INITIAL_VISIBLE_HISTORY);
  const visibleLogs = showOlder ? initialLogs : initialLogs.slice(0, INITIAL_VISIBLE_HISTORY);

  return (
    <div className="px-4 py-2">
      <ul className="divide-y divide-border/60">
        {visibleLogs.map((log) => (
          <li key={log.id}>
            <IssueHistoryItem log={log} />
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && !showOlder ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full text-muted-foreground"
          onClick={() => setShowOlder(true)}
        >
          {t("admin.history.showOlder", { count: hiddenCount })}
        </Button>
      ) : null}
    </div>
  );
}
