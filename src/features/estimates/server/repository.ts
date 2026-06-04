import type { EstimateVersionStatus, Prisma } from "@prisma/client";

import { prisma } from "@/db/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EstimateWithLatestVersion = Awaited<ReturnType<typeof getEstimateForEditor>>;
export type VersionWithTree = Awaited<ReturnType<typeof getVersionWithTree>>;
export type EstimateListItem = Awaited<ReturnType<typeof listEstimates>>[number];
export type RevisionSnapshot = {
  sections: Array<{
    id: string;
    title: string;
    sortOrder: number;
    items: Array<{
      id: string;
      name: string;
      unit: string | null;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      sortOrder: number;
    }>;
  }>;
  marginPercent: number;
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createEstimateWithFirstVersion(input: {
  workspaceId: string;
  title?: string;
  createdByUserId?: string;
}): Promise<{ estimateId: string; versionId: string }> {
  return prisma.$transaction(async (tx) => {
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
  });
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export async function getEstimateForEditor(estimateId: string, workspaceId: string) {
  return prisma.estimate.findFirst({
    where: { id: estimateId, workspaceId, deletedAt: null },
    include: {
      estimateRequest: {
        select: {
          id: true,
          requestNumber: true,
          status: true,
          customerData: true,
          address: true,
          projectDescription: true,
          createdAt: true,
        },
      },
      latestVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          marginPercent: true,
          createdByUserId: true,
          updatedAt: true,
        },
      },
      versions: {
        orderBy: { versionNumber: "asc" },
        select: {
          id: true,
          versionNumber: true,
          status: true,
          marginPercent: true,
          createdAt: true,
          createdByUserId: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function getVersionWithTree(versionId: string, workspaceId: string) {
  return prisma.estimateVersion.findFirst({
    where: { id: versionId, workspaceId },
    include: {
      sections: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          lineItems: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function listEstimates(workspaceId: string) {
  return prisma.estimate.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      latestVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          updatedAt: true,
        },
      },
      estimateRequest: {
        select: {
          id: true,
          requestNumber: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: { versions: true },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Version copy
// ---------------------------------------------------------------------------

export async function createVersionCopy(input: {
  fromVersionId: string;
  workspaceId: string;
  userId: string;
  newVersionNumber: number;
}): Promise<{ versionId: string }> {
  return prisma.$transaction(async (tx) => {
    const source = await tx.estimateVersion.findUniqueOrThrow({
      where: { id: input.fromVersionId },
      include: {
        sections: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            lineItems: {
              where: { deletedAt: null },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    const newVersion = await tx.estimateVersion.create({
      data: {
        estimateId: source.estimateId,
        workspaceId: input.workspaceId,
        versionNumber: input.newVersionNumber,
        status: "DRAFT",
        marginPercent: source.marginPercent,
        createdByUserId: input.userId,
      },
    });

    for (const section of source.sections) {
      const newSection = await tx.estimateSection.create({
        data: {
          workspaceId: input.workspaceId,
          versionId: newVersion.id,
          title: section.title,
          sortOrder: section.sortOrder,
        },
      });

      for (const item of section.lineItems) {
        await tx.estimateLineItem.create({
          data: {
            workspaceId: input.workspaceId,
            sectionId: newSection.id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            sortOrder: item.sortOrder,
          },
        });
      }
    }

    await tx.estimate.update({
      where: { id: source.estimateId },
      data: { latestVersionId: newVersion.id },
    });

    return { versionId: newVersion.id };
  });
}

// ---------------------------------------------------------------------------
// Section & line item CRUD
// ---------------------------------------------------------------------------

export async function addSectionToVersion(input: {
  workspaceId: string;
  versionId: string;
  title?: string;
}) {
  const lastSection = await prisma.estimateSection.findFirst({
    where: { versionId: input.versionId, deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return prisma.estimateSection.create({
    data: {
      workspaceId: input.workspaceId,
      versionId: input.versionId,
      title: input.title ?? "New section",
      sortOrder: (lastSection?.sortOrder ?? -1) + 1,
    },
  });
}

export async function addLineItemToSection(input: {
  workspaceId: string;
  sectionId: string;
}) {
  const lastItem = await prisma.estimateLineItem.findFirst({
    where: { sectionId: input.sectionId, deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  return prisma.estimateLineItem.create({
    data: {
      workspaceId: input.workspaceId,
      sectionId: input.sectionId,
      name: "",
      quantity: 0,
      unitPrice: 0,
      vatRate: 0.23,
      sortOrder: (lastItem?.sortOrder ?? -1) + 1,
    },
  });
}

export async function upsertSection(input: {
  id?: string;
  workspaceId: string;
  versionId: string;
  title: string;
  sortOrder?: number;
}) {
  if (input.id) {
    return prisma.estimateSection.update({
      where: { id: input.id },
      data: { title: input.title, sortOrder: input.sortOrder ?? 0 },
    });
  }
  return prisma.estimateSection.create({
    data: {
      workspaceId: input.workspaceId,
      versionId: input.versionId,
      title: input.title,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function upsertLineItem(input: {
  id?: string;
  workspaceId: string;
  sectionId: string;
  name: string;
  unit?: string | null;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  sortOrder?: number;
}) {
  const data = {
    name: input.name,
    unit: input.unit ?? null,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
    vatRate: input.vatRate,
    sortOrder: input.sortOrder ?? 0,
  };

  if (input.id) {
    return prisma.estimateLineItem.update({ where: { id: input.id }, data });
  }
  return prisma.estimateLineItem.create({
    data: {
      workspaceId: input.workspaceId,
      sectionId: input.sectionId,
      ...data,
    },
  });
}

export async function deleteLineItem(itemId: string) {
  return prisma.estimateLineItem.update({
    where: { id: itemId },
    data: { deletedAt: new Date() },
  });
}

export async function deleteSection(sectionId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.estimateLineItem.updateMany({
      where: { sectionId },
      data: { deletedAt: new Date() },
    });
    return tx.estimateSection.update({
      where: { id: sectionId },
      data: { deletedAt: new Date() },
    });
  });
}

export async function reorderItems(
  versionId: string,
  workspaceId: string,
  items: Array<{ id: string; sectionId: string; sortOrder: number }>,
) {
  return prisma.$transaction(
    items.map((item) =>
      prisma.estimateLineItem.update({
        where: { id: item.id },
        data: { sectionId: item.sectionId, sortOrder: item.sortOrder },
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Revisions (undo snapshots)
// ---------------------------------------------------------------------------

export async function saveRevision(input: {
  versionId: string;
  workspaceId: string;
  userId: string;
  source: "AI_APPROVED" | "MANUAL";
}): Promise<void> {
  const version = await prisma.estimateVersion.findUniqueOrThrow({
    where: { id: input.versionId },
    include: {
      sections: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          lineItems: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  const snapshot: RevisionSnapshot = {
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

  await prisma.$transaction(async (tx) => {
    await tx.estimateRevision.create({
      data: {
        versionId: input.versionId,
        workspaceId: input.workspaceId,
        snapshotJson: snapshot as unknown as Prisma.InputJsonValue,
        source: input.source,
        createdByUserId: input.userId,
      },
    });

    const revisions = await tx.estimateRevision.findMany({
      where: { versionId: input.versionId },
      orderBy: { createdAt: "asc" },
    });

    if (revisions.length > 3) {
      const toDelete = revisions.slice(0, revisions.length - 3);
      await tx.estimateRevision.deleteMany({
        where: { id: { in: toDelete.map((r) => r.id) } },
      });
    }
  });
}

export async function getRevisions(versionId: string, limit = 3) {
  return prisma.estimateRevision.findMany({
    where: { versionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function restoreRevision(versionId: string, revisionId: string): Promise<void> {
  const revision = await prisma.estimateRevision.findUniqueOrThrow({
    where: { id: revisionId },
  });

  const snapshot = revision.snapshotJson as unknown as RevisionSnapshot;

  await prisma.$transaction(async (tx) => {
    const existingSections = await tx.estimateSection.findMany({
      where: { versionId, deletedAt: null },
    });

    await tx.estimateLineItem.updateMany({
      where: { sectionId: { in: existingSections.map((s) => s.id) } },
      data: { deletedAt: new Date() },
    });
    await tx.estimateSection.updateMany({
      where: { versionId },
      data: { deletedAt: new Date() },
    });

    for (const section of snapshot.sections) {
      const newSection = await tx.estimateSection.create({
        data: {
          workspaceId: revision.workspaceId,
          versionId,
          title: section.title,
          sortOrder: section.sortOrder,
        },
      });
      for (const item of section.items) {
        await tx.estimateLineItem.create({
          data: {
            workspaceId: revision.workspaceId,
            sectionId: newSection.id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            sortOrder: item.sortOrder,
          },
        });
      }
    }

    await tx.estimateVersion.update({
      where: { id: versionId },
      data: { marginPercent: snapshot.marginPercent },
    });
  });
}

// ---------------------------------------------------------------------------
// Autosave with concurrency check
// ---------------------------------------------------------------------------

export interface AutoSaveData {
  marginPercent?: number;
  sections?: Array<{
    id?: string;
    title: string;
    sortOrder: number;
    items: Array<{
      id?: string;
      name: string;
      unit?: string | null;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      sortOrder: number;
    }>;
  }>;
}

export interface AutoSaveResult {
  conflict: boolean;
  updatedAt?: Date;
}

export async function autoSave(input: {
  versionId: string;
  workspaceId: string;
  data: AutoSaveData;
  expectedUpdatedAt: Date;
}): Promise<AutoSaveResult> {
  const current = await prisma.estimateVersion.findFirst({
    where: { id: input.versionId, workspaceId: input.workspaceId },
    select: { updatedAt: true },
  });

  if (!current) {
    return { conflict: true };
  }

  if (current.updatedAt.toISOString() !== input.expectedUpdatedAt.toISOString()) {
    return { conflict: true };
  }

  const updateData: Prisma.EstimateVersionUpdateInput = {};
  if (input.data.marginPercent !== undefined) {
    updateData.marginPercent = input.data.marginPercent;
  }

  const updated = await prisma.estimateVersion.update({
    where: { id: input.versionId },
    data: updateData,
  });

  return { conflict: false, updatedAt: updated.updatedAt };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function getVersionStatus(
  versionId: string,
  workspaceId: string,
): Promise<EstimateVersionStatus | null> {
  const v = await prisma.estimateVersion.findFirst({
    where: { id: versionId, workspaceId },
    select: { status: true },
  });
  return v?.status ?? null;
}
