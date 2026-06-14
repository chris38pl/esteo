"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { EstimatePdfBeforeExportResult } from "@/features/estimates/hooks/use-estimate-pdf-output";
import { WorkspaceCompanyProfilePdfWarningDialog } from "@/features/workspaces/components/workspace-company-profile-pdf-warning-dialog";
import {
  getMissingWorkspaceCompanyProfileFields,
  type WorkspaceCompanyProfileClient,
  type WorkspaceCompanyProfileField,
} from "@/features/workspaces/lib/company-profile-for-export";
import type { Locale } from "@/lib/locale";

export function useEstimatePdfBeforeExport(input: {
  workspaceCompanyProfile: WorkspaceCompanyProfileClient;
  ensureSaved: () => Promise<boolean>;
  workspaceSlug: string;
  locale: Locale;
}) {
  const router = useRouter();
  const resolverRef = useRef<((result: EstimatePdfBeforeExportResult) => void) | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    missingFields: WorkspaceCompanyProfileField[];
  }>({
    open: false,
    missingFields: [],
  });

  const resolvePending = useCallback((result: EstimatePdfBeforeExportResult) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const onBeforeExport = useCallback(async (): Promise<EstimatePdfBeforeExportResult> => {
    const saved = await input.ensureSaved();
    if (!saved) {
      return { proceed: false, reason: "unsaved" };
    }

    const missingFields = getMissingWorkspaceCompanyProfileFields(input.workspaceCompanyProfile);
    if (missingFields.length === 0) {
      return { proceed: true };
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({ open: true, missingFields });
    });
  }, [input]);

  const closeDialog = useCallback(() => {
    setDialogState((current) => ({ ...current, open: false }));
  }, []);

  const handleProceed = useCallback(() => {
    closeDialog();
    resolvePending({ proceed: true });
  }, [closeDialog, resolvePending]);

  const handleCancel = useCallback(() => {
    closeDialog();
    resolvePending({ proceed: false, reason: "cancelled" });
  }, [closeDialog, resolvePending]);

  const handleGoToSettings = useCallback(() => {
    closeDialog();
    resolvePending({ proceed: false, reason: "cancelled" });
    router.push(`/${input.locale}/dashboard/${input.workspaceSlug}/settings?tab=company`);
  }, [closeDialog, input.locale, input.workspaceSlug, resolvePending, router]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel],
  );

  const dialog = (
    <WorkspaceCompanyProfilePdfWarningDialog
      open={dialogState.open}
      missingFields={dialogState.missingFields}
      onOpenChange={handleOpenChange}
      onProceed={handleProceed}
      onGoToSettings={handleGoToSettings}
    />
  );

  return {
    onBeforeExport,
    dialog,
  };
}
