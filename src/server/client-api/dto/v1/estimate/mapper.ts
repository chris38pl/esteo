import type {
  EstimateCard,
  EstimateDetail,
  EstimateVersionTree,
} from "@/server/client-api/dto/v1/estimate/dto";

type EstimateStatus = EstimateCard["status"];

export type EstimateCardInput = {
  id: string;
  title: string | null;
  currency: string;
  attachmentCount: number;
  updatedAt: Date;
  latestVersion: { status: EstimateStatus; totalNet: number; totalGross: number } | null;
  estimateRequest: { requestNumber: string | null } | null;
  _count: { versions: number };
  listContext: { customerName: string | null; investmentCity: string | null };
};

/** Structural version-tree input (matches the serialized `VersionTreeClient`). */
export type VersionTreeInput = {
  id: string;
  versionNumber: number;
  status: NonNullable<EstimateStatus>;
  marginPercent: number;
  sections: Array<{
    id: string;
    title: string;
    sortOrder: number;
    lineItems: Array<{
      id: string;
      sectionId: string;
      name: string;
      unit: string | null;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      sortOrder: number;
    }>;
  }>;
};

export type EstimateDetailInput = {
  estimate: {
    id: string;
    title: string | null;
    currency: string;
    latestVersion: { status: EstimateStatus; totalNet: number; totalGross: number } | null;
    versions: ReadonlyArray<unknown>;
  };
  versionTree: VersionTreeInput | null;
  attachmentCount: number;
};

/** Pure: estimate list item -> EstimateCard DTO. */
export function toEstimateCard(item: EstimateCardInput): EstimateCard {
  return {
    id: item.id,
    title: item.title,
    status: item.latestVersion?.status ?? null,
    currency: item.currency,
    totalNet: item.latestVersion?.totalNet ?? null,
    totalGross: item.latestVersion?.totalGross ?? null,
    versionCount: item._count.versions,
    attachmentCount: item.attachmentCount,
    customerName: item.listContext.customerName,
    city: item.listContext.investmentCity,
    requestNumber: item.estimateRequest?.requestNumber ?? null,
    updatedAt: item.updatedAt.toISOString(),
  };
}

function toVersionTree(tree: VersionTreeInput): EstimateVersionTree {
  return {
    id: tree.id,
    versionNumber: tree.versionNumber,
    status: tree.status,
    marginPercent: tree.marginPercent,
    sections: tree.sections.map((section) => ({
      id: section.id,
      title: section.title,
      sortOrder: section.sortOrder,
      lineItems: section.lineItems.map((item) => ({
        id: item.id,
        sectionId: item.sectionId,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        sortOrder: item.sortOrder,
      })),
    })),
  };
}

/** Pure: estimate envelope + version tree -> first-render EstimateDetail DTO. */
export function toEstimateDetail(input: EstimateDetailInput): EstimateDetail {
  const { estimate, versionTree, attachmentCount } = input;
  return {
    id: estimate.id,
    title: estimate.title,
    currency: estimate.currency,
    status: estimate.latestVersion?.status ?? null,
    version: versionTree ? toVersionTree(versionTree) : null,
    summary: {
      versionCount: estimate.versions.length,
      attachmentCount,
      totalNet: estimate.latestVersion?.totalNet ?? null,
      totalGross: estimate.latestVersion?.totalGross ?? null,
    },
  };
}
