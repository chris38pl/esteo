import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { BusinessDocumentType } from "@prisma/client";

import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";
import {
  getEstimateForEditor,
  getVersionWithTree,
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
import { isEstimatePinned } from "@/features/estimates/server/pinned-estimates";
import { resolveUserEmailsByIds } from "@/features/users/server/resolve-user-emails";

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
  const editorKey = `${activeVersionId ?? "none"}-${serializedTree?.updatedAt ?? "empty"}`;

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

  return (
    <>
      <SyncDashboardBreadcrumbDetail label={breadcrumbLabel} />
      <EstimateEditor
        key={editorKey}
        estimate={serializeEstimateForEditor(estimate)}
        versionTree={serializedTree}
        activeVersionId={activeVersionId ?? null}
        workspaceSlug={workspaceSlug}
        locale={resolvedLocale}
        rulesApplied={rulesApplied}
        investmentPropertyType={investmentPropertyType}
        initialAiMessages={initialAiMessages}
        initialPendingEdit={initialPendingEdit}
        isPinned={pinned}
        userEmailsById={userEmailsById}
      />
    </>
  );
}
