import "server-only";

import { BusinessDocumentType } from "@prisma/client";
import { tasks } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { buildEstimateTitleFromPublicRequest } from "@/features/estimates/lib/build-estimate-title-from-public-request";
import type { FieldValueInput } from "@/features/industry-fields/server/map-field-value";
import {
  ESTIMATE_ACTIVITY_ACTIONS,
  logEstimateActivity,
} from "@/features/estimates/server/activity-log";
import { listDocumentFieldValues } from "@/features/industry-fields/server/repository";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import type { Locale } from "@/lib/locale";
import { recordUsageInTx } from "@/server/billing/usage-service";
import { assertCanCreateEstimate } from "@/server/permissions/entitlements";
import type { generateEstimateDraftTask } from "@/trigger/generate-estimate-draft";
import {
  scheduleUpsertSearchDocumentForEstimate,
  scheduleUpsertSearchDocumentForInquiry,
} from "@/features/search/server/index-service";

export class ConvertRequestToEstimateError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_FOUND"
      | "ALREADY_LINKED"
      | "ENTITLEMENT"
      | "UNAVAILABLE",
  ) {
    super(message);
    this.name = "ConvertRequestToEstimateError";
  }
}

export async function convertRequestToEstimate(input: {
  requestId: string;
  workspaceId: string;
  userId: string;
  locale: Locale;
  templateId?: string | null;
  priceListId?: string | null;
}): Promise<{ estimateId: string; versionId: string }> {
  await assertCanCreateEstimate(input.workspaceId);

  const request = await prisma.estimateRequest.findFirst({
    where: {
      id: input.requestId,
      workspaceId: input.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
      estimateId: true,
      customerData: true,
      address: true,
      projectDescription: true,
      workspace: {
        select: { industry: true },
      },
    },
  });

  if (!request) {
    throw new ConvertRequestToEstimateError("Request not found.", "NOT_FOUND");
  }

  if (request.estimateId) {
    throw new ConvertRequestToEstimateError(
      "Request already has a linked estimate.",
      "ALREADY_LINKED",
    );
  }

  const fieldValues = await listDocumentFieldValues({
    workspaceId: input.workspaceId,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    documentId: request.id,
  });

  const industryFieldValues: Record<string, FieldValueInput> = {};
  for (const row of fieldValues) {
    const value = readTypedFieldValue(row);
    if (value !== null) {
      industryFieldValues[row.fieldKey] = value as FieldValueInput;
    }
  }

  const customerData = request.customerData as {
    fullName?: string;
    email?: string;
    phone?: string;
  } | null;

  const address = request.address as {
    streetAddress?: string;
    city?: string;
    postalCode?: string;
    voivodeship?: string;
  } | null;

  const estimateTitle = buildEstimateTitleFromPublicRequest({
    industry: request.workspace.industry,
    fullName: customerData?.fullName ?? "",
    address: address ?? {
      streetAddress: "",
      city: "",
      postalCode: "",
      voivodeship: "",
    },
    industryFieldValues,
    locale: input.locale,
  });

  const { estimateId, versionId } = await prisma.$transaction(async (tx) => {
    const estimate = await tx.estimate.create({
      data: {
        workspaceId: input.workspaceId,
        title: estimateTitle,
        latestVersionId: null,
      },
    });

    const version = await tx.estimateVersion.create({
      data: {
        estimateId: estimate.id,
        workspaceId: input.workspaceId,
        versionNumber: 1,
        status: "DRAFT",
        marginPercent: 0,
        createdByUserId: input.userId,
      },
    });

    await tx.estimate.update({
      where: { id: estimate.id },
      data: { latestVersionId: version.id },
    });

    await tx.estimateRequest.update({
      where: { id: request.id },
      data: { estimateId: estimate.id },
    });

    await recordUsageInTx(tx, {
      workspaceId: input.workspaceId,
      userId: input.userId,
      meter: "ESTIMATE_CREATED",
    });

    return { estimateId: estimate.id, versionId: version.id };
  });

  await tasks.trigger<typeof generateEstimateDraftTask>("generate-estimate-draft", {
    estimateRequestId: request.id,
    estimateId,
    versionId,
    workspaceId: input.workspaceId,
    locale: input.locale,
    templateId: input.templateId,
    priceListId: input.priceListId,
    uploadSource: "INTERNAL_REQUEST",
    uploadedById: input.userId,
  });

  await logEstimateActivity({
    estimateId,
    workspaceId: input.workspaceId,
    actorType: "USER",
    actorUserId: input.userId,
    category: "ESTIMATE",
    action: ESTIMATE_ACTIVITY_ACTIONS.estimate_created,
    metadata: { source: "request_conversion" },
  });

  scheduleUpsertSearchDocumentForEstimate(estimateId);
  scheduleUpsertSearchDocumentForInquiry(request.id);

  return { estimateId, versionId };
}
