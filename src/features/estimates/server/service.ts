import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import { proposeEstimateEdit } from "@/ai/services/propose-estimate-edit";
import { BusinessDocumentType, type Prisma } from "@prisma/client";
import { prisma } from "@/db/client";
import { getIndustryFieldsForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import {
  upsertDocumentFieldValues,
  validateDocumentFieldValues,
} from "@/features/industry-fields/server/validate-document-values";
import { buildEstimateTitleFromPublicRequest } from "@/features/estimates/lib/build-estimate-title-from-public-request";
import { coerceIndustryFieldValues } from "@/features/estimate-requests/lib/coerce-industry-field-values";
import type { InternalEstimateCreateInput } from "@/features/estimate-requests/schemas/request";
import { getTranslations } from "next-intl/server";
import {
  appendAiMessage,
} from "@/features/estimates/server/ai-messages-repository";
import { buildAgentEditInputs } from "@/features/estimates/lib/build-agent-edit-guidance";
import { syncVersionTotals } from "@/features/estimates/lib/sync-version-totals";
import type {
  EstimateVersionSnapshot,
  ProposeEditResult,
} from "@/features/estimates/lib/estimate-agent-types";
import { simulateAgentPatch } from "@/features/estimates/lib/simulate-agent-patch";
import { validateAgentPatch } from "@/features/estimates/lib/validate-agent-patch";
import { loadEstimateGenerationContext } from "@/features/workspaces/lib/load-estimate-generation-context";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import {
  assertCanCreateEstimate,
  assertCanUseAiAssistant,
  getMaxUndoSteps,
  incrementAiAssistantUsage,
  incrementEstimateUsage,
} from "@/server/permissions/entitlements";
import { tasks } from "@trigger.dev/sdk";
import type { generateEstimateDraftTask } from "@/trigger/generate-estimate-draft";
import {
  assertVersionEditable,
  autoSave,
  createEstimateWithFirstVersion,
  createVersionCopy,
  getRevisions,
  getVersionWithTree,
  restoreRevision,
  saveRevision,
  type AutoSaveData,
  type AutoSaveResult,
} from "./repository";

// ---------------------------------------------------------------------------
// Internal estimate creation
// ---------------------------------------------------------------------------

export async function createInternalEstimate(
  input: {
    userId: string;
    workspaceId: string;
    locale: Locale;
  } & InternalEstimateCreateInput,
): Promise<{ estimateId: string }> {
  await assertCanCreateEstimate(input.userId);

  const workspace = await prisma.workspace.findFirst({
    where: { id: input.workspaceId, deletedAt: null },
    select: { id: true, industry: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  const fields = await getIndustryFieldsForDocument({
    workspaceId: workspace.id,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    locale: input.locale,
  });

  const dynamicValues = coerceIndustryFieldValues({
    fields,
    values: input.industryFields,
  });

  await validateDocumentFieldValues({
    industry: workspace.industry,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    values: dynamicValues,
  });

  const explicitTitle = input.title?.trim() || undefined;
  const generatedTitle = buildEstimateTitleFromPublicRequest({
    industry: workspace.industry,
    fullName: input.customer.fullName,
    address: input.address,
    industryFieldValues: dynamicValues,
    locale: input.locale,
  });
  const estimateTitle = explicitTitle ?? generatedTitle ?? null;

  const requestNumber = await generateInternalRequestNumber(input.workspaceId);

  const { estimateId, versionId, requestId } = await prisma.$transaction(async (tx) => {
    const { estimateId: eid, versionId: vid } = await createEstimateWithFirstVersionInTx(
      tx,
      {
        workspaceId: input.workspaceId,
        title: estimateTitle ?? undefined,
        createdByUserId: input.userId,
      },
    );

    const createdRequest = await tx.estimateRequest.create({
      data: {
        workspaceId: input.workspaceId,
        requestNumber,
        estimateId: eid,
        customerData: {
          fullName: input.customer.fullName,
          email: input.customer.email,
          phone: input.customer.phone,
          project: {
            preferredStartDate: input.project.preferredStartDate,
          },
        },
        address: input.address,
        projectDescription: input.project.description,
        attachments: [],
        aiMetadata: {
          source: "internal_dashboard",
          createdByUserId: input.userId,
        },
      },
      select: { id: true },
    });

    return { estimateId: eid, versionId: vid, requestId: createdRequest.id };
  });

  if (Object.keys(dynamicValues).length > 0) {
    await upsertDocumentFieldValues({
      workspaceId: input.workspaceId,
      industry: workspace.industry,
      documentType: BusinessDocumentType.ESTIMATE_REQUEST,
      documentId: requestId,
      values: dynamicValues,
    });
  }

  await incrementEstimateUsage(input.userId);

  await tasks.trigger<typeof generateEstimateDraftTask>("generate-estimate-draft", {
    estimateRequestId: requestId,
    estimateId,
    versionId,
    workspaceId: input.workspaceId,
    locale: input.locale,
  });

  return { estimateId };
}

// ---------------------------------------------------------------------------
// Version management
// ---------------------------------------------------------------------------

export async function createNewVersion(input: {
  estimateId: string;
  workspaceId: string;
  userId: string;
}): Promise<{ versionId: string; versionNumber: number }> {
  const estimate = await prisma.estimate.findFirstOrThrow({
    where: { id: input.estimateId, workspaceId: input.workspaceId, deletedAt: null },
    include: {
      versions: { select: { id: true, versionNumber: true } },
      latestVersion: { select: { id: true } },
    },
  });

  if (estimate.versions.length >= 10) {
    throw new Error("VERSION_LIMIT_REACHED");
  }

  const maxVersionNumber = Math.max(...estimate.versions.map((v) => v.versionNumber));
  const newVersionNumber = maxVersionNumber + 1;
  const fromVersionId = estimate.latestVersionId ?? estimate.versions[0].id;

  const { versionId } = await createVersionCopy({
    fromVersionId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    newVersionNumber,
  });

  return { versionId, versionNumber: newVersionNumber };
}

// ---------------------------------------------------------------------------
// AI assistant
// ---------------------------------------------------------------------------

function versionTreeToSnapshot(
  version: NonNullable<Awaited<ReturnType<typeof getVersionWithTree>>>,
): EstimateVersionSnapshot {
  return {
    marginPercent: Number(version.marginPercent),
    sections: version.sections.map((s) => ({
      id: s.id,
      title: s.title,
      sortOrder: s.sortOrder,
      items: s.lineItems.map((li) => ({
        id: li.id,
        name: li.name,
        unit: li.unit,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        vatRate: Number(li.vatRate),
        sortOrder: li.sortOrder,
      })),
    })),
  };
}

export async function proposeEdit(input: {
  versionId: string;
  workspaceId: string;
  userId: string;
  message: string;
  locale: string;
}): Promise<ProposeEditResult> {
  await assertCanUseAiAssistant(input.userId);
  await assertVersionEditable(input.versionId, input.workspaceId);

  const version = await getVersionWithTree(input.versionId, input.workspaceId);

  if (!version) {
    throw new Error("VERSION_NOT_FOUND");
  }

  const locale: Locale = isLocale(input.locale) ? input.locale : "pl";
  const context = await loadEstimateGenerationContext(input.workspaceId, locale);

  if (!context) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  const snapshot = versionTreeToSnapshot(version);
  const { agentContext, compactTree, guidance } = buildAgentEditInputs(
    snapshot,
    input.message,
    locale,
  );

  const patch = await proposeEstimateEdit({
    userMessage: input.message,
    context,
    agentContext,
    guidance,
    compactTree,
  });

  const simulatedImpact = simulateAgentPatch(snapshot, patch);
  const warnings = validateAgentPatch({
    snapshot,
    patch,
    guidance,
    simulatedImpact,
    currency: agentContext.currency,
  });

  const result: ProposeEditResult = { patch, guidance, simulatedImpact, warnings };
  const t = await getTranslations({ locale, namespace: "estimates" });
  const assistantContent = patch.reasoning ?? t("ai.proposedReasoning");

  await prisma.$transaction(async (tx) => {
    await appendAiMessage(tx, {
      versionId: input.versionId,
      role: "USER",
      content: input.message,
    });
    await appendAiMessage(tx, {
      versionId: input.versionId,
      role: "ASSISTANT",
      content: assistantContent,
      proposalJson: result as Prisma.InputJsonValue,
    });
  });

  return result;
}

export async function approveEdit(input: {
  versionId: string;
  workspaceId: string;
  userId: string;
  patch: EstimateAgentPatch;
}): Promise<{ updatedAt: Date }> {
  await assertVersionEditable(input.versionId, input.workspaceId);

  await saveRevision({
    versionId: input.versionId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    source: "AI_APPROVED",
  });

  await applyPatch(input.versionId, input.workspaceId, input.patch);
  await incrementAiAssistantUsage(input.userId);

  const updated = await prisma.estimateVersion.findUniqueOrThrow({
    where: { id: input.versionId },
    select: { updatedAt: true },
  });

  return { updatedAt: updated.updatedAt };
}

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------

export async function undoLastChange(input: {
  versionId: string;
  workspaceId: string;
  userId: string;
}): Promise<void> {
  await assertVersionEditable(input.versionId, input.workspaceId);

  const maxSteps = await getMaxUndoSteps(input.userId);
  const revisions = await getRevisions(input.versionId, maxSteps);

  if (revisions.length === 0) {
    throw new Error("NO_REVISIONS");
  }

  const latest = revisions[0];
  await restoreRevision(input.versionId, input.workspaceId, latest.id);
}

// ---------------------------------------------------------------------------
// Autosave
// ---------------------------------------------------------------------------

export async function autoSaveVersion(input: {
  versionId: string;
  workspaceId: string;
  userId: string;
  data: AutoSaveData;
  expectedUpdatedAt: Date;
}): Promise<AutoSaveResult> {
  return autoSave({
    versionId: input.versionId,
    workspaceId: input.workspaceId,
    data: input.data,
    expectedUpdatedAt: input.expectedUpdatedAt,
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getRequestIdForEstimate(estimateId: string): Promise<string> {
  const req = await prisma.estimateRequest.findFirstOrThrow({
    where: { estimateId },
    select: { id: true },
  });
  return req.id;
}

async function generateInternalRequestNumber(workspaceId: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `ER-${year}-`;
  const count = await prisma.estimateRequest.count({
    where: { workspaceId, requestNumber: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(5, "0")}`;
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function createEstimateWithFirstVersionInTx(
  tx: TxClient,
  input: {
    workspaceId: string;
    title?: string;
    createdByUserId?: string;
  },
): Promise<{ estimateId: string; versionId: string }> {
  const estimate = await tx.estimate.create({
    data: {
      workspaceId: input.workspaceId,
      title: input.title ?? null,
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
      createdByUserId: input.createdByUserId ?? null,
    },
  });

  await tx.estimate.update({
    where: { id: estimate.id },
    data: { latestVersionId: version.id },
  });

  return { estimateId: estimate.id, versionId: version.id };
}

async function applyPatch(
  versionId: string,
  workspaceId: string,
  patch: EstimateAgentPatch,
): Promise<void> {
  await assertVersionEditable(versionId, workspaceId);

  await prisma.$transaction(async (tx) => {
    if (patch.marginPercent != null) {
      await tx.estimateVersion.update({
        where: { id: versionId },
        data: { marginPercent: patch.marginPercent },
      });
    }

    if (patch.newSections.length > 0) {
      const existing = await tx.estimateSection.findMany({
        where: { versionId, deletedAt: null },
        orderBy: { sortOrder: "desc" },
        take: 1,
      });
      let nextOrder = (existing[0]?.sortOrder ?? -1) + 1;
      for (const ns of patch.newSections) {
        await tx.estimateSection.create({
          data: {
            workspaceId,
            versionId,
            title: ns.title,
            sortOrder: ns.sortOrder ?? nextOrder++,
          },
        });
      }
    }

    if (patch.updates.length > 0) {
      for (const u of patch.updates) {
        const updateData: Record<string, unknown> = {};
        if (u.name != null) updateData.name = u.name;
        if (u.unit != null) updateData.unit = u.unit;
        if (u.quantity != null) updateData.quantity = u.quantity;
        if (u.unitPrice != null) updateData.unitPrice = u.unitPrice;
        if (u.vatRate != null) updateData.vatRate = u.vatRate;
        if (Object.keys(updateData).length) {
          await tx.estimateLineItem.update({
            where: { id: u.itemId },
            data: updateData,
          });
        }
      }
    }

    if (patch.deletions.length > 0) {
      await tx.estimateLineItem.updateMany({
        where: { id: { in: patch.deletions } },
        data: { deletedAt: new Date() },
      });
    }

    if (patch.additions.length > 0) {
      for (const addition of patch.additions) {
        let section = await tx.estimateSection.findFirst({
          where: {
            versionId,
            title: addition.sectionTitle,
            deletedAt: null,
          },
        });

        if (!section) {
          const lastSection = await tx.estimateSection.findFirst({
            where: { versionId, deletedAt: null },
            orderBy: { sortOrder: "desc" },
          });
          section = await tx.estimateSection.create({
            data: {
              workspaceId,
              versionId,
              title: addition.sectionTitle,
              sortOrder: (lastSection?.sortOrder ?? -1) + 1,
            },
          });
        }

        const lastItem = await tx.estimateLineItem.findFirst({
          where: { sectionId: section.id, deletedAt: null },
          orderBy: { sortOrder: "desc" },
        });
        let nextItemOrder = (lastItem?.sortOrder ?? -1) + 1;

        for (const item of addition.items) {
          await tx.estimateLineItem.create({
            data: {
              workspaceId,
              sectionId: section.id,
              name: item.name,
              unit: item.unit ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              sortOrder: nextItemOrder++,
            },
          });
        }
      }
    }
  });

  await syncVersionTotals(versionId, workspaceId);
}
