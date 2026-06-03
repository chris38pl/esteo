import { BusinessDocumentType, type Prisma, type WorkspaceIndustry } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryFieldsForDocument, type IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import type { FieldValueInput } from "@/features/industry-fields/server/map-field-value";
import { upsertDocumentFieldValues, validateDocumentFieldValues } from "@/features/industry-fields/server/validate-document-values";
import type { PublicEstimateRequestInput } from "@/features/estimate-requests/schemas/request";
import { tasks } from "@trigger.dev/sdk";
import type { generateEstimateDraftTask } from "@/trigger/generate-estimate-draft";
import type { Locale } from "@/lib/locale";

export type PublicEstimateRequestWorkspace = {
  id: string;
  name: string;
  slug: string;
  industry: WorkspaceIndustry;
};

export type PublicEstimateRequestPageData = {
  workspace: PublicEstimateRequestWorkspace;
  fields: IndustryFieldForDocument[];
};

export async function getPublicEstimateRequestPageData(input: {
  workspaceSlug: string;
  locale: Locale;
}): Promise<PublicEstimateRequestPageData | null> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      slug: input.workspaceSlug,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
    },
  });

  if (!workspace) {
    return null;
  }

  const fields = await getIndustryFieldsForDocument({
    workspaceId: workspace.id,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    locale: input.locale,
  });

  return { workspace, fields };
}

export async function createPublicEstimateRequest(input: {
  locale: Locale;
  payload: PublicEstimateRequestInput;
  requestMeta: {
    ip: string;
    userAgent: string;
  };
}) {
  const pageData = await getPublicEstimateRequestPageData({
    workspaceSlug: input.payload.workspaceSlug,
    locale: input.locale,
  });

  if (!pageData) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  const dynamicValues = coerceIndustryFieldValues({
    fields: pageData.fields,
    values: input.payload.industryFields,
  });

  await validateDocumentFieldValues({
    industry: pageData.workspace.industry,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    values: dynamicValues,
  });

  const { request, estimateId, versionId } = await prisma.$transaction(async (tx) => {
    const requestNumber = await generateRequestNumber(tx, pageData.workspace.id);

    const estimate = await tx.estimate.create({
      data: {
        workspaceId: pageData.workspace.id,
        latestVersionId: null,
      },
    });

    const version = await tx.estimateVersion.create({
      data: {
        estimateId: estimate.id,
        workspaceId: pageData.workspace.id,
        versionNumber: 1,
        status: "DRAFT",
        marginPercent: 0,
      },
    });

    await tx.estimate.update({
      where: { id: estimate.id },
      data: { latestVersionId: version.id },
    });

    const eid = estimate.id;
    const vid = version.id;

    const createdRequest = await tx.estimateRequest.create({
      data: {
        workspaceId: pageData.workspace.id,
        requestNumber,
        estimateId: eid,
        customerData: {
          fullName: input.payload.customer.fullName,
          email: input.payload.customer.email,
          phone: input.payload.customer.phone,
          project: {
            preferredStartDate: input.payload.project.preferredStartDate,
          },
        },
        address: input.payload.address,
        projectDescription: input.payload.project.description,
        attachments: [],
        aiMetadata: {
          source: "public_estimate_request_form",
          locale: input.locale,
          security: {
            ip: input.requestMeta.ip,
            userAgent: input.requestMeta.userAgent,
          },
        },
      },
      select: {
        id: true,
        requestNumber: true,
      },
    });

    return { request: createdRequest, estimateId: eid, versionId: vid };
  });

  if (Object.keys(dynamicValues).length > 0) {
    await upsertDocumentFieldValues({
      workspaceId: pageData.workspace.id,
      industry: pageData.workspace.industry,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      documentId: request.id,
      values: dynamicValues,
    });
  }

  await tasks.trigger<typeof generateEstimateDraftTask>("generate-estimate-draft", {
    estimateRequestId: request.id,
    estimateId,
    versionId,
    workspaceId: pageData.workspace.id,
    locale: input.locale,
  });

  return request;
}

async function generateRequestNumber(
  tx: Prisma.TransactionClient,
  workspaceId: string,
): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `ER-${year}-`;

  const count = await tx.estimateRequest.count({
    where: {
      workspaceId,
      requestNumber: { startsWith: prefix },
    },
  });

  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

function coerceIndustryFieldValues(input: {
  fields: IndustryFieldForDocument[];
  values: PublicEstimateRequestInput["industryFields"];
}): Record<string, FieldValueInput> {
  const definitionByKey = new Map(input.fields.map((field) => [field.key, field]));
  const coerced: Record<string, FieldValueInput> = {};

  for (const [key, value] of Object.entries(input.values)) {
    const definition = definitionByKey.get(key);
    if (!definition || value === null || value === "") {
      coerced[key] = value;
      continue;
    }

    switch (definition.valueType) {
      case "NUMBER":
        coerced[key] = typeof value === "number" ? value : Number(value);
        break;
      case "BOOLEAN":
        coerced[key] = typeof value === "boolean" ? value : value === "true";
        break;
      case "DATE":
        coerced[key] = new Date(`${String(value)}T00:00:00.000Z`);
        break;
      default:
        coerced[key] = String(value).trim();
        break;
    }
  }

  return coerced;
}
