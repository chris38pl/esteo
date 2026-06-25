import "server-only";

import { z } from "zod";

import { prisma } from "@/db/client";
import {
  buildTemplatePayload,
} from "@/features/estimate-templates/lib/template-editor-draft";
import {
  EstimateImportEmptyStructureError,
  estimateVersionToTemplateDraft,
} from "@/features/estimate-templates/lib/estimate-to-template-draft";
import {
  ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH,
  ESTIMATE_TEMPLATE_NAME_MAX_LENGTH,
} from "@/features/estimate-templates/lib/template-limits";
import { loadEstimatesForListPage } from "@/features/estimates/server/list-estimates-page-data";
import { getVersionWithTree } from "@/features/estimates/server/repository";
import { serializeVersionWithTree } from "@/features/estimates/lib/serialize-estimate";
import { createEstimateTemplate } from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import type { User } from "@prisma/client";

import type { EstimateImportListItem } from "@/features/estimate-templates/types/estimate-import";

const importTemplateFromEstimateInputSchema = z.object({
  workspaceId: z.string().min(1),
  estimateId: z.string().min(1),
  name: z.string().trim().min(1).max(ESTIMATE_TEMPLATE_NAME_MAX_LENGTH),
  description: z
    .string()
    .max(ESTIMATE_TEMPLATE_DESCRIPTION_MAX_LENGTH)
    .optional()
    .default(""),
});

function formatInvestmentLabel(input: {
  investmentPropertyType: string | null;
  investmentStreet: string | null;
  investmentCity: string | null;
}): string | null {
  const parts = [
    input.investmentPropertyType,
    [input.investmentStreet, input.investmentCity].filter(Boolean).join(", "),
  ].filter((part) => part && part.trim().length > 0);

  return parts.length > 0 ? parts.join(" · ") : null;
}

async function loadVersionsWithStructure(versionIds: string[]): Promise<Set<string>> {
  if (versionIds.length === 0) {
    return new Set();
  }

  const rows = await prisma.estimateSection.findMany({
    where: {
      versionId: { in: versionIds },
      deletedAt: null,
      title: { not: "" },
      lineItems: {
        some: {
          deletedAt: null,
          name: { not: "" },
        },
      },
    },
    select: { versionId: true },
    distinct: ["versionId"],
  });

  return new Set(rows.map((row) => row.versionId));
}

export async function listEstimatesForTemplateImport(
  workspaceId: string,
  locale: Locale,
): Promise<EstimateImportListItem[]> {
  const estimates = await loadEstimatesForListPage(workspaceId, locale);
  const versionIds = estimates
    .map((estimate) => estimate.latestVersion?.id)
    .filter((id): id is string => Boolean(id));
  const versionsWithStructure = await loadVersionsWithStructure(versionIds);

  return estimates.map((estimate) => {
    const latestVersionId = estimate.latestVersion?.id ?? null;
    const ctx = estimate.listContext;

    return {
      id: estimate.id,
      title: estimate.title?.trim() || "",
      requestNumber: estimate.estimateRequest?.requestNumber ?? null,
      customerName: ctx.customerName,
      investmentLabel: formatInvestmentLabel({
        investmentPropertyType: ctx.investmentPropertyType,
        investmentStreet: ctx.investmentStreet,
        investmentCity: ctx.investmentCity,
      }),
      latestVersionId,
      hasStructure: latestVersionId ? versionsWithStructure.has(latestVersionId) : false,
    };
  });
}

export async function importTemplateFromEstimate(
  user: User,
  input: z.infer<typeof importTemplateFromEstimateInputSchema>,
): Promise<{ templateId: string }> {
  const parsed = importTemplateFromEstimateInputSchema.parse(input);

  const estimate = await prisma.estimate.findFirst({
    where: {
      id: parsed.estimateId,
      workspaceId: parsed.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
      latestVersionId: true,
    },
  });

  if (!estimate?.latestVersionId) {
    throw new EstimateImportEmptyStructureError();
  }

  const rawVersion = await getVersionWithTree(estimate.latestVersionId, parsed.workspaceId);
  if (!rawVersion) {
    throw new EstimateImportEmptyStructureError();
  }

  const versionTree = serializeVersionWithTree(rawVersion);
  const draft = estimateVersionToTemplateDraft({
    name: parsed.name,
    description: parsed.description,
    versionTree,
  });

  const template = await createEstimateTemplate(
    user,
    parsed.workspaceId,
    buildTemplatePayload(draft),
  );

  return { templateId: template.id };
}

export { importTemplateFromEstimateInputSchema };
