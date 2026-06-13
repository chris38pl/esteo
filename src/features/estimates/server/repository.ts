import { Prisma, type EstimateVersionStatus } from "@prisma/client";

import { prisma } from "@/db/client";
import { isPersistedEntityId } from "@/features/estimates/lib/persisted-entity-id";
import { serverPerfEnd, serverPerfStart } from "@/features/estimates/lib/server-perf";
import { syncVersionTotals, syncVersionTotalsFromPayload } from "@/features/estimates/lib/sync-version-totals";
import { isEstimateVersionEditable } from "@/features/estimates/lib/version-mutability";
import { PermissionError } from "@/server/permissions/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EstimateWithLatestVersion = Awaited<ReturnType<typeof getEstimateForEditor>>;
export type VersionWithTree = Awaited<ReturnType<typeof getVersionWithTree>>;

type EstimateListQueryRow = Prisma.EstimateGetPayload<{
  include: {
    latestVersion: {
      select: {
        id: true;
        versionNumber: true;
        status: true;
        updatedAt: true;
        createdByUserId: true;
      };
    };
    estimateRequest: {
      select: {
        id: true;
        requestNumber: true;
        status: true;
        createdAt: true;
        customerData: true;
        address: true;
      };
    };
    _count: {
      select: { versions: true };
    };
  };
}>;

export type EstimateListItem = Omit<EstimateListQueryRow, "latestVersion"> & {
  latestVersion:
    | (NonNullable<EstimateListQueryRow["latestVersion"]> & {
        totalNet: number;
        totalGross: number;
      })
    | null;
};
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
          updatedAt: true,
        },
      },
      latestVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          marginPercent: true,
          totalNet: true,
          totalGross: true,
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
          totalNet: true,
          totalGross: true,
          createdAt: true,
          createdByUserId: true,
          updatedAt: true,
        },
      },
    },
  });
}

export async function updateEstimateTitle(input: {
  estimateId: string;
  workspaceId: string;
  title: string | null;
}): Promise<{ title: string | null }> {
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: input.estimateId,
      workspaceId: input.workspaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!estimate) {
    throw new PermissionError("Estimate not found.");
  }

  const updated = await prisma.estimate.update({
    where: { id: input.estimateId },
    data: { title: input.title },
    select: { title: true },
  });

  return { title: updated.title };
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

export async function listEstimates(workspaceId: string): Promise<EstimateListItem[]> {
  const estimates = await prisma.estimate.findMany({
    where: { workspaceId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      latestVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          updatedAt: true,
          createdByUserId: true,
        },
      },
      estimateRequest: {
        select: {
          id: true,
          requestNumber: true,
          status: true,
          createdAt: true,
          customerData: true,
          address: true,
        },
      },
      _count: {
        select: { versions: true },
      },
    },
  });

  const versionIds = estimates
    .map((estimate) => estimate.latestVersion?.id)
    .filter((id): id is string => Boolean(id));

  if (versionIds.length === 0) {
    return estimates.map((estimate): EstimateListItem =>
      estimate.latestVersion
        ? {
            ...estimate,
            latestVersion: {
              ...estimate.latestVersion,
              totalNet: 0,
              totalGross: 0,
            },
          }
        : (estimate as EstimateListItem),
    );
  }

  const totalsRows = await prisma.$queryRaw<
    Array<{ id: string; totalNet: Prisma.Decimal; totalGross: Prisma.Decimal }>
  >`
    SELECT id, "totalNet", "totalGross"
    FROM "EstimateVersion"
    WHERE id IN (${Prisma.join(versionIds)})
  `;

  const totalsById = new Map(
    totalsRows.map((row) => [
      row.id,
      {
        totalNet: Number(row.totalNet),
        totalGross: Number(row.totalGross),
      },
    ]),
  );

  return estimates.map((estimate): EstimateListItem => {
    if (!estimate.latestVersion) return estimate as EstimateListItem;
    const totals = totalsById.get(estimate.latestVersion.id) ?? {
      totalNet: 0,
      totalGross: 0,
    };
    return {
      ...estimate,
      latestVersion: {
        ...estimate.latestVersion,
        ...totals,
      },
    };
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

    await syncVersionTotals(newVersion.id, input.workspaceId, tx);

    return { versionId: newVersion.id };
  });
}

// ---------------------------------------------------------------------------
// Section & line item CRUD
// ---------------------------------------------------------------------------

export async function assertVersionEditable(
  versionId: string,
  workspaceId: string,
): Promise<void> {
  const status = await getVersionStatus(versionId, workspaceId);
  if (!status) {
    throw new PermissionError("Estimate version not found.");
  }
  if (!isEstimateVersionEditable(status)) {
    throw new PermissionError("Archived versions cannot be modified.");
  }
}

async function assertSectionVersionEditable(
  sectionId: string,
  workspaceId: string,
): Promise<void> {
  const section = await prisma.estimateSection.findFirst({
    where: { id: sectionId, workspaceId, deletedAt: null },
    select: { versionId: true },
  });
  if (!section) {
    throw new PermissionError("Section not found.");
  }
  await assertVersionEditable(section.versionId, workspaceId);
}

async function assertLineItemVersionEditable(
  itemId: string,
  workspaceId: string,
): Promise<void> {
  const item = await prisma.estimateLineItem.findFirst({
    where: { id: itemId, workspaceId, deletedAt: null },
    select: { section: { select: { versionId: true } } },
  });
  if (!item) {
    throw new PermissionError("Line item not found.");
  }
  await assertVersionEditable(item.section.versionId, workspaceId);
}

export async function archiveEstimateVersion(input: {
  versionId: string;
  workspaceId: string;
  estimateId: string;
}): Promise<void> {
  const version = await prisma.estimateVersion.findFirst({
    where: {
      id: input.versionId,
      workspaceId: input.workspaceId,
      estimateId: input.estimateId,
    },
    select: { status: true },
  });

  if (!version) {
    throw new PermissionError("Estimate version not found.");
  }

  if (version.status === "ARCHIVED") {
    return;
  }

  await prisma.estimateVersion.update({
    where: { id: input.versionId },
    data: { status: "ARCHIVED" },
  });
}

export async function unarchiveEstimateVersion(input: {
  versionId: string;
  workspaceId: string;
  estimateId: string;
}): Promise<void> {
  const version = await prisma.estimateVersion.findFirst({
    where: {
      id: input.versionId,
      workspaceId: input.workspaceId,
      estimateId: input.estimateId,
    },
    select: { status: true },
  });

  if (!version) {
    throw new PermissionError("Estimate version not found.");
  }

  if (version.status !== "ARCHIVED") {
    return;
  }

  await prisma.estimateVersion.update({
    where: { id: input.versionId },
    data: { status: "DRAFT" },
  });
}

export async function deleteEstimateVersion(input: {
  versionId: string;
  workspaceId: string;
  estimateId: string;
}): Promise<{ redirectVersionNumber: number }> {
  return prisma.$transaction(async (tx) => {
    const versions = await tx.estimateVersion.findMany({
      where: { estimateId: input.estimateId, workspaceId: input.workspaceId },
      orderBy: { versionNumber: "desc" },
      select: { id: true, versionNumber: true },
    });

    if (versions.length <= 1) {
      throw new PermissionError("An estimate must have at least one version.");
    }

    const deleting = versions.find((version) => version.id === input.versionId);
    if (!deleting) {
      throw new PermissionError("Estimate version not found.");
    }

    const estimate = await tx.estimate.findFirstOrThrow({
      where: { id: input.estimateId, workspaceId: input.workspaceId },
      select: { latestVersionId: true },
    });

    await tx.estimateVersion.delete({ where: { id: input.versionId } });

    const remaining = versions.filter((version) => version.id !== input.versionId);
    const fallback = remaining[0];

    if (estimate.latestVersionId === input.versionId) {
      await tx.estimate.update({
        where: { id: input.estimateId },
        data: { latestVersionId: fallback.id },
      });
    }

    return { redirectVersionNumber: fallback.versionNumber };
  });
}

export async function addSectionToVersion(input: {
  workspaceId: string;
  versionId: string;
  title?: string;
}) {
  await assertVersionEditable(input.versionId, input.workspaceId);

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
  await assertSectionVersionEditable(input.sectionId, input.workspaceId);

  const lastItem = await prisma.estimateLineItem.findFirst({
    where: { sectionId: input.sectionId, deletedAt: null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const item = await prisma.estimateLineItem.create({
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

  return item;
}

export async function upsertSection(input: {
  id?: string;
  workspaceId: string;
  versionId: string;
  title: string;
  sortOrder?: number;
}) {
  await assertVersionEditable(input.versionId, input.workspaceId);

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
  await assertSectionVersionEditable(input.sectionId, input.workspaceId);

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

export async function deleteLineItem(itemId: string, workspaceId: string) {
  await assertLineItemVersionEditable(itemId, workspaceId);

  const lineItem = await prisma.estimateLineItem.findFirstOrThrow({
    where: { id: itemId, workspaceId },
    select: { section: { select: { versionId: true } } },
  });

  const result = await prisma.estimateLineItem.update({
    where: { id: itemId },
    data: { deletedAt: new Date() },
  });

  await syncVersionTotals(lineItem.section.versionId, workspaceId);
  return result;
}

export async function deleteSection(sectionId: string, workspaceId: string) {
  const section = await prisma.estimateSection.findFirstOrThrow({
    where: { id: sectionId, workspaceId, deletedAt: null },
    select: { versionId: true },
  });
  await assertVersionEditable(section.versionId, workspaceId);

  const result = await prisma.$transaction(async (tx) => {
    await tx.estimateLineItem.updateMany({
      where: { sectionId },
      data: { deletedAt: new Date() },
    });
    return tx.estimateSection.update({
      where: { id: sectionId },
      data: { deletedAt: new Date() },
    });
  });

  await syncVersionTotals(section.versionId, workspaceId);
  return result;
}

export async function reorderItems(
  versionId: string,
  workspaceId: string,
  items: Array<{ id: string; sectionId: string; sortOrder: number }>,
) {
  await assertVersionEditable(versionId, workspaceId);

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

export async function restoreRevision(
  versionId: string,
  workspaceId: string,
  revisionId: string,
): Promise<void> {
  await assertVersionEditable(versionId, workspaceId);

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

    await syncVersionTotals(versionId, workspaceId, tx);
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
  serverPerfStart("autoSaveAction.autoSaveVersion.autoSave.conflictCheck");
  const current = await prisma.estimateVersion.findFirst({
    where: { id: input.versionId, workspaceId: input.workspaceId },
    select: { status: true, updatedAt: true },
  });

  if (!current) {
    serverPerfEnd("autoSaveAction.autoSaveVersion.autoSave.conflictCheck");
    return { conflict: true };
  }

  if (!isEstimateVersionEditable(current.status)) {
    serverPerfEnd("autoSaveAction.autoSaveVersion.autoSave.conflictCheck");
    throw new PermissionError("Archived versions cannot be modified.");
  }

  if (current.updatedAt.toISOString() !== input.expectedUpdatedAt.toISOString()) {
    serverPerfEnd("autoSaveAction.autoSaveVersion.autoSave.conflictCheck");
    return { conflict: true };
  }
  serverPerfEnd("autoSaveAction.autoSaveVersion.autoSave.conflictCheck");

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: Prisma.EstimateVersionUpdateInput = {};
    if (input.data.marginPercent !== undefined) {
      updateData.marginPercent = input.data.marginPercent;
    }

    if (input.data.sections) {
      serverPerfStart("autoSaveAction.autoSaveVersion.autoSave.tx.updates");
      await Promise.all(
        input.data.sections.map(async (section) => {
          if (!isPersistedEntityId(section.id)) {
            console.warn("[estimate autosave] server skipped section without persisted id", {
              kind: "section",
              id: section.id,
              title: section.title,
            });
            return;
          }

          await tx.estimateSection.updateMany({
            where: {
              id: section.id,
              versionId: input.versionId,
              workspaceId: input.workspaceId,
              deletedAt: null,
            },
            data: {
              title: section.title,
              sortOrder: section.sortOrder,
            },
          });

          await Promise.all(
            section.items.map(async (item) => {
              if (!isPersistedEntityId(item.id)) {
                console.warn("[estimate autosave] server skipped line item without persisted id", {
                  kind: "lineItem",
                  id: item.id,
                  sectionId: section.id,
                  name: item.name,
                });
                return;
              }

              await tx.estimateLineItem.updateMany({
                where: {
                  id: item.id,
                  workspaceId: input.workspaceId,
                  deletedAt: null,
                  section: {
                    versionId: input.versionId,
                    workspaceId: input.workspaceId,
                    deletedAt: null,
                  },
                },
                data: {
                  name: item.name,
                  unit: item.unit ?? null,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  vatRate: item.vatRate,
                  sortOrder: item.sortOrder,
                },
              });
            }),
          );
        }),
      );
      serverPerfEnd("autoSaveAction.autoSaveVersion.autoSave.tx.updates");

      serverPerfStart("autoSaveAction.autoSaveVersion.autoSave.tx.syncTotals");
      await syncVersionTotalsFromPayload(input.data.sections, input.versionId, tx);
      serverPerfEnd("autoSaveAction.autoSaveVersion.autoSave.tx.syncTotals");
    }

    serverPerfStart("autoSaveAction.autoSaveVersion.autoSave.tx.versionUpdate");
    const version = await tx.estimateVersion.update({
      where: { id: input.versionId },
      data: updateData,
    });
    serverPerfEnd("autoSaveAction.autoSaveVersion.autoSave.tx.versionUpdate");
    return version;
  });

  return { conflict: false, updatedAt: updated.updatedAt };
}

export interface PatchLineItemData {
  name: string;
  unit?: string | null;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export async function patchLineItem(input: {
  versionId: string;
  workspaceId: string;
  itemId: string;
  data: PatchLineItemData;
  sections: NonNullable<AutoSaveData["sections"]>;
  expectedUpdatedAt: Date;
}): Promise<AutoSaveResult> {
  if (!isPersistedEntityId(input.itemId)) {
    throw new Error("Line item id is not persisted.");
  }

  serverPerfStart("patchLineItemAction.patchLineItem.conflictCheck");
  const current = await prisma.estimateVersion.findFirst({
    where: { id: input.versionId, workspaceId: input.workspaceId },
    select: { status: true, updatedAt: true },
  });

  if (!current) {
    serverPerfEnd("patchLineItemAction.patchLineItem.conflictCheck");
    return { conflict: true };
  }

  if (!isEstimateVersionEditable(current.status)) {
    serverPerfEnd("patchLineItemAction.patchLineItem.conflictCheck");
    throw new PermissionError("Archived versions cannot be modified.");
  }

  if (current.updatedAt.toISOString() !== input.expectedUpdatedAt.toISOString()) {
    serverPerfEnd("patchLineItemAction.patchLineItem.conflictCheck");
    return { conflict: true };
  }
  serverPerfEnd("patchLineItemAction.patchLineItem.conflictCheck");

  const updated = await prisma.$transaction(async (tx) => {
    serverPerfStart("patchLineItemAction.patchLineItem.tx.update");
    await tx.estimateLineItem.updateMany({
      where: {
        id: input.itemId,
        workspaceId: input.workspaceId,
        deletedAt: null,
        section: {
          versionId: input.versionId,
          workspaceId: input.workspaceId,
          deletedAt: null,
        },
      },
      data: {
        name: input.data.name,
        unit: input.data.unit ?? null,
        quantity: input.data.quantity,
        unitPrice: input.data.unitPrice,
        vatRate: input.data.vatRate,
      },
    });
    serverPerfEnd("patchLineItemAction.patchLineItem.tx.update");

    serverPerfStart("patchLineItemAction.patchLineItem.tx.syncTotals");
    await syncVersionTotalsFromPayload(input.sections, input.versionId, tx);
    serverPerfEnd("patchLineItemAction.patchLineItem.tx.syncTotals");

    serverPerfStart("patchLineItemAction.patchLineItem.tx.versionUpdate");
    const version = await tx.estimateVersion.update({
      where: { id: input.versionId },
      data: {},
    });
    serverPerfEnd("patchLineItemAction.patchLineItem.tx.versionUpdate");
    return version;
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

export async function getVersionUpdatedAt(
  versionId: string,
  workspaceId: string,
): Promise<string | null> {
  const version = await prisma.estimateVersion.findFirst({
    where: { id: versionId, workspaceId },
    select: { updatedAt: true },
  });
  return version?.updatedAt.toISOString() ?? null;
}
