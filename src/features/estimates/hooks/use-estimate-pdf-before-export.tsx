"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CompanyProfileCompletionModal } from "@/features/activation/components/company-profile-completion-modal";
import type { EstimatePdfBeforeExportResult } from "@/features/estimates/hooks/use-estimate-pdf-output";
import {
  getMissingWorkspaceCompanyProfileFields,
  type WorkspaceCompanyProfileClient,
  type WorkspaceCompanyProfileField,
} from "@/features/workspaces/lib/company-profile-for-export";
import type { Locale } from "@/lib/locale";

export function useEstimatePdfBeforeExport(input: {
  workspaceCompanyProfile: WorkspaceCompanyProfileClient;
  ensureSaved: () => Promise<boolean>;
  workspaceId: string;
  workspaceSlug: string;
  workspaceLogoUrl: string | null;
  locale: Locale;
  onProfileUpdated?: (profile: WorkspaceCompanyProfileClient) => void;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(input.workspaceCompanyProfile);
  const resolverRef = useRef<((result: EstimatePdfBeforeExportResult) => void) | null>(null);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    missingFields: WorkspaceCompanyProfileField[];
  }>({
    open: false,
    missingFields: [],
  });

  useEffect(() => {
    setProfile(input.workspaceCompanyProfile);
  }, [input.workspaceCompanyProfile]);

  const resolvePending = useCallback((result: EstimatePdfBeforeExportResult) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const onBeforeExport = useCallback(async (): Promise<EstimatePdfBeforeExportResult> => {
    const saved = await input.ensureSaved();
    if (!saved) {
      return { proceed: false, reason: "unsaved" };
    }

    const missingFields = getMissingWorkspaceCompanyProfileFields(profile);
    if (missingFields.length === 0) {
      return { proceed: true };
    }

    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({ open: true, missingFields });
    });
  }, [input, profile]);

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

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    },
    [handleCancel],
  );

  const handleProfileUpdated = useCallback(
    (nextProfile: WorkspaceCompanyProfileClient) => {
      setProfile(nextProfile);
      input.onProfileUpdated?.(nextProfile);
      router.refresh();
    },
    [input, router],
  );

  const dialog = (
    <CompanyProfileCompletionModal
      open={dialogState.open}
      workspaceId={input.workspaceId}
      workspaceSlug={input.workspaceSlug}
      locale={input.locale}
      initialProfile={profile}
      initialLogoUrl={input.workspaceLogoUrl}
      missingFields={dialogState.missingFields}
      onOpenChange={handleOpenChange}
      onProceed={handleProceed}
      onProfileUpdated={handleProfileUpdated}
    />
  );

  return {
    onBeforeExport,
    dialog,
  };
}
