import type { EstimateAgentPatch } from "@/ai/schemas/estimate-agent-patch";
import { proposeEstimateEdit } from "@/ai/services/propose-estimate-edit";
import { prisma } from "@/db/client";
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

export async function createInternalEstimate(input: {
  userId: string;
  workspaceId: string;
  title?: string;
  projectDescription: string;
  locale: string;
}): Promise<{ estimateId: string }> {
  await assertCanCreateEstimate(input.userId);

  const requestNumber = await generateInternalRequestNumber(input.workspaceId);

  const { estimateId, versionId } = await prisma.$transaction(async (tx) => {
    const { estimateId: eid, versionId: vid } = await createEstimateWithFirstVersionInTx(
      tx,
      {
        workspaceId: input.workspaceId,
        title: input.title,
        createdByUserId: input.userId,
      },
    );

    await tx.estimateRequest.create({
      data: {
        workspaceId: input.workspaceId,
        requestNumber,
        projectDescription: input.projectDescription,
        estimateId: eid,
        aiMetadata: {
          source: "internal_dashboard",
          createdByUserId: input.userId,
        },
      },
    });

    return { estimateId: eid, versionId: vid };
  });

  await incrementEstimateUsage(input.userId);

  await tasks.trigger<typeof generateEstimateDraftTask>("generate-estimate-draft", {
    estimateRequestId: await getRequestIdForEstimate(estimateId),
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

export async function proposeEdit(input: {
  versionId: string;
  workspaceId: string;
  userId: string;
  message: string;
  locale: string;
}): Promise<EstimateAgentPatch> {
  await assertCanUseAiAssistant(input.userId);

  const version = await getVersionWithTree(input.versionId, input.workspaceId);

  if (!version) {
    throw new Error("VERSION_NOT_FOUND");
  }

  const locale: Locale = isLocale(input.locale) ? input.locale : "pl";
  const context = await loadEstimateGenerationContext(input.workspaceId, locale);

  if (!context) {
    throw new Error("WORKSPACE_NOT_FOUND");
  }

  return proposeEstimateEdit({
    userMessage: input.message,
    currentVersion: {
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
    },
    context,
  });
}

export async function approveEdit(input: {
  versionId: string;
  workspaceId: string;
  userId: string;
  patch: EstimateAgentPatch;
}): Promise<{ updatedAt: Date }> {
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
  const maxSteps = await getMaxUndoSteps(input.userId);
  const revisions = await getRevisions(input.versionId, maxSteps);

  if (revisions.length === 0) {
    throw new Error("NO_REVISIONS");
  }

  const latest = revisions[0];
  await restoreRevision(input.versionId, latest.id);
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

    console.log(
      JSON.stringify(patch, null, 2)
    );

    if (patch.updates.length > 0) {
      for (const u of patch.updates) {
        const updateData: Record<string, unknown> = {};
        if (u.name != null) updateData.name = u.name;
        if (u.unit != null) updateData.unit = u.unit;
        if (u.quantity != null) updateData.quantity = u.quantity;
        if (u.unitPrice != null) updateData.unitPrice = u.unitPrice;
        if (u.vatRate != null) updateData.vatRate = u.vatRate;
        if (Object.keys(updateData).length) {
        console.log("Updating item", u.itemId);
        const item = await tx.estimateLineItem.findUnique({
          where: {
            id: u.itemId,
          },
        });

        console.log("Item lookup:", item);
          const existing = await tx.estimateLineItem.findUnique({
            where: { id: u.itemId },
          });
          console.log("Exists?", !!existing);
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
}
