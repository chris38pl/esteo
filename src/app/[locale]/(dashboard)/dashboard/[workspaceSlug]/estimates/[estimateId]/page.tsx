import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { BusinessDocumentType } from "@prisma/client";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { isAvatarPreset } from "@/lib/avatars/user-avatar-presets";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import {
  getEstimateForEditor,
  getVersionWithTree,
  countRevisions,
} from "@/features/estimates/server/repository";
import { SyncDashboardBreadcrumbDetail } from "@/components/layout/dashboard-top-nav/sync-dashboard-breadcrumb-detail";
import { EstimateEditor } from "@/features/estimates/components/estimate-editor";
import {
  serializeEstimateForEditor,
  serializeVersionWithTree,
} from "@/features/estimates/lib/serialize-estimate";
import {
  estimateAiRulesApplied,
  loadEstimateGenerationContext,
} from "@/features/workspaces/lib/load-estimate-generation-context";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import { listDocumentFieldValues } from "@/features/industry-fields/server/repository";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import {
  deriveInitialPendingEdit,
  serializeAiMessages,
} from "@/features/estimates/lib/serialize-ai-messages";
import {
  getLatestAiApprovedRevisionAt,
  listAiMessagesByVersionId,
} from "@/features/estimates/server/ai-messages-repository";
import { serializeEstimateActivityLogs } from "@/features/estimates/lib/serialize-estimate-activity";
import { serializeEstimateNotes } from "@/features/estimates/lib/serialize-estimate-notes";
import { listActivityLogsByEstimateId } from "@/features/estimates/server/activity-log-repository";
import { isEstimatePinned } from "@/features/estimates/server/pinned-estimates";
import { listNotesByEstimateId } from "@/features/estimates/server/notes-repository";
import { serializePaymentInstallments } from "@/features/estimates/lib/serialize-payment-installments";
import { listPaymentInstallmentsByEstimateId } from "@/features/estimates/server/payment-installments-repository";
import { resolveUserEmailsByIds } from "@/features/users/server/resolve-user-emails";
import { listAttachmentsByEstimateId } from "@/features/attachments/server/attachments-repository";
import {
  serializeEstimateAttachments,
  serializeWorkspaceStorageSummary,
} from "@/features/attachments/lib/serialize-attachments";
import { getWorkspaceStorageSummary } from "@/features/attachments/server/assert-workspace-storage";
import { listEstimatePdfsByEstimateId } from "@/features/estimates/server/estimate-pdf-repository";
import { serializeEstimatePdfs } from "@/features/estimates/lib/serialize-estimate-pdfs";
import { getMaxUndoSteps } from "@/server/permissions/entitlements";
import { findWorkspaceSettings } from "@/features/workspaces/server/repository";
import {
  buildWorkspaceCompanyProfileExport,
  serializeWorkspaceCompanyProfileClient,
} from "@/features/workspaces/lib/company-profile-for-export";
import { loadEstimateVersionWorkflow } from "@/features/estimates/server/load-estimate-version-workflow";
import type { EstimateVersionWorkflowClient } from "@/features/estimates/lib/serialize-estimate-version-workflow";

function readConfigurationSource(aiMetadata: unknown): {
  templateName: string | null;
} | null {
  if (!aiMetadata || typeof aiMetadata !== "object") {
    return null;
  }

  const metadata = aiMetadata as Record<string, unknown>;
  const snapshot = metadata.configurationSnapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const snapshotRecord = snapshot as Record<string, unknown>;
  const template = snapshotRecord.template;
  const templateName =
    template && typeof template === "object" && typeof (template as Record<string, unknown>).name === "string"
      ? ((template as Record<string, string>).name ?? null)
      : null;

  if (!templateName) {
    return null;
  }

  return { templateName };
}

export default async function EstimateEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; workspaceSlug: string; estimateId: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { locale, workspaceSlug, estimateId } = await params;
  const { v } = await searchParams;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const estimate = await getEstimateForEditor(estimateId, resolved.workspace.id);

  if (!estimate) {
    redirect(`/${resolvedLocale}/dashboard/${workspaceSlug}/estimates`);
  }

  let activeVersionId = estimate.latestVersionId ?? estimate.versions[0]?.id;

  if (v) {
    const versionNumber = parseInt(v, 10);
    const found = estimate.versions.find((ver) => ver.versionNumber === versionNumber);
    if (found) {
      activeVersionId = found.id;
    }
  }

  const rawVersionTree = activeVersionId
    ? await getVersionWithTree(activeVersionId, resolved.workspace.id)
    : null;

  const serializedTree = rawVersionTree ? serializeVersionWithTree(rawVersionTree) : null;
  const configurationSource = readConfigurationSource(estimate.aiMetadata);
  const sectionCount = serializedTree?.sections.length ?? 0;
  const requestStatus = estimate.estimateRequest?.status ?? "none";
  const editorKey = `${activeVersionId ?? "none"}-${sectionCount}-${requestStatus}`;

  const generationContext = await loadEstimateGenerationContext(
    resolved.workspace.id,
    resolvedLocale,
  );
  const rulesApplied = generationContext
    ? estimateAiRulesApplied(generationContext)
    : false;

  const requestFieldValues = estimate.estimateRequest
    ? await listDocumentFieldValues({
        workspaceId: resolved.workspace.id,
        documentType: BusinessDocumentType.ESTIMATE_REQUEST,
        documentId: estimate.estimateRequest.id,
      })
    : [];
  const propertyTypeValue = requestFieldValues.find(
    (field) => field.fieldKey === "property_type",
  );
  const rawPropertyType = propertyTypeValue
    ? readTypedFieldValue(propertyTypeValue)
    : null;
  const investmentPropertyType =
    typeof rawPropertyType === "string" && rawPropertyType.length > 0
      ? getIndustryOptionLabel(
          "property_type",
          rawPropertyType,
          resolvedLocale,
          "label",
        )
      : null;

  const aiMessageRows =
    activeVersionId != null
      ? await listAiMessagesByVersionId(activeVersionId)
      : [];
  const latestAiApprovedRevisionAt =
    activeVersionId != null
      ? await getLatestAiApprovedRevisionAt(activeVersionId)
      : null;
  const initialAiMessages = serializeAiMessages(aiMessageRows);
  const initialPendingEdit = deriveInitialPendingEdit(
    aiMessageRows,
    latestAiApprovedRevisionAt,
  );

  const pinned = await isEstimatePinned({
    userId: user.id,
    workspaceId: resolved.workspace.id,
    estimateId,
  });

  const breadcrumbLabel =
    estimate.title?.trim() ||
    estimate.estimateRequest?.requestNumber?.trim() ||
    null;

  const userEmailsMap = await resolveUserEmailsByIds([
    ...estimate.versions.map((version) => version.createdByUserId),
    rawVersionTree?.createdByUserId,
  ]);
  const userEmailsById = Object.fromEntries(userEmailsMap);

  const noteRows = await listNotesByEstimateId(estimateId);
  const initialNotes = serializeEstimateNotes(noteRows);

  const activityRows = await listActivityLogsByEstimateId(estimateId);
  const initialActivityLogs = serializeEstimateActivityLogs(activityRows);

  const paymentInstallmentRows = await listPaymentInstallmentsByEstimateId(estimateId);
  const initialPaymentInstallments = serializePaymentInstallments(paymentInstallmentRows);

  const attachmentRows = await listAttachmentsByEstimateId(estimateId, resolved.workspace.id);
  const initialAttachments = serializeEstimateAttachments(attachmentRows);
  const storageSummary = serializeWorkspaceStorageSummary(
    getWorkspaceStorageSummary({
      attachmentStorageUsedBytes: resolved.workspace.attachmentStorageUsedBytes,
      attachmentStorageLimitBytes: resolved.workspace.attachmentStorageLimitBytes,
    }),
  );

  const pdfRows = await listEstimatePdfsByEstimateId(estimateId);
  const initialPdfDocuments = serializeEstimatePdfs(pdfRows);

  const maxUndoSteps = await getMaxUndoSteps(resolved.workspace.id);
  const revisionCount =
    activeVersionId != null ? await countRevisions(activeVersionId) : 0;
  const availableUndoSteps = Math.min(revisionCount, maxUndoSteps);
  const workspaceSettings = await findWorkspaceSettings(resolved.workspace.id);
  const workspaceCompanyProfile = serializeWorkspaceCompanyProfileClient({
    name: resolved.workspace.name,
    settings: workspaceSettings,
  });
  const workspaceCompanyProfileExport = buildWorkspaceCompanyProfileExport({
    name: resolved.workspace.name,
    settings: workspaceSettings,
  });
  const versionWorkflow: EstimateVersionWorkflowClient =
    (activeVersionId
      ? await loadEstimateVersionWorkflow(
          activeVersionId,
          resolved.workspace.id,
          estimate.estimateRequest?.customerData,
        )
      : null) ?? {
      status: rawVersionTree?.status ?? "DRAFT",
      archivedAt: rawVersionTree?.archivedAt?.toISOString() ?? null,
      lastSentAt: null,
      lastSentToEmail: null,
      acceptedAt: null,
      rejectedAt: null,
      successfulSendCount: 0,
      activeSend: null,
      defaultCustomerEmail: null,
    };

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={breadcrumbLabel} />
      <EstimateEditor
        key={editorKey}
        estimate={serializeEstimateForEditor(estimate, sectionCount)}
        versionTree={serializedTree}
        activeVersionId={activeVersionId ?? null}
        workspaceSlug={workspaceSlug}
        locale={resolvedLocale}
        rulesApplied={rulesApplied}
        configurationSource={configurationSource}
        investmentPropertyType={investmentPropertyType}
        initialAiMessages={initialAiMessages}
        initialPendingEdit={initialPendingEdit}
        isPinned={pinned}
        userEmailsById={userEmailsById}
        initialNotes={initialNotes}
        initialActivityLogs={initialActivityLogs}
        initialPaymentInstallments={initialPaymentInstallments}
        initialAttachments={initialAttachments}
        initialPdfDocuments={initialPdfDocuments}
        storageSummary={storageSummary}
        currentUserId={user.id}
        currentUserAvatarUrl={user.avatarUrl}
        currentUserAvatarPreset={
          isAvatarPreset(user.avatarPreset) ? user.avatarPreset : null
        }
        maxUndoSteps={maxUndoSteps}
        availableUndoSteps={availableUndoSteps}
        workspaceCompanyProfile={workspaceCompanyProfile}
        workspaceLogoUrl={workspaceCompanyProfileExport.logoUrl}
        versionWorkflow={versionWorkflow}
      />
    </>
  );
}
