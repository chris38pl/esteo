"use client";

import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";

import { EstimateSendMetaLines } from "@/features/estimates/components/estimate-send-meta-lines";
import type { EstimateVersionWorkflowClient } from "@/features/estimates/lib/serialize-estimate-version-workflow";

export function EstimateReadOnlyVersionBanner({
  workflow,
}: {
  workflow: EstimateVersionWorkflowClient;
}) {
  const t = useTranslations("estimates");

  const hasSendMeta = workflow.successfulSendCount > 0 || workflow.lastSentAt != null;

  return (
    <div className="rounded-xl border border-blue-300/80 bg-blue-50/90 p-4 text-sm text-blue-900 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100">
      <div className="flex items-start gap-4">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-300"
          aria-hidden
        >
          <LockKeyhole className="size-5" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="font-medium leading-relaxed">{t("editor.readOnlyBanner")}</p>
          {hasSendMeta ? (
            <EstimateSendMetaLines
              workflow={workflow}
              layout="inline"
              className="text-xs text-blue-800/85 dark:text-blue-100/80"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
