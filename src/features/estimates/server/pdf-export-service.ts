import "server-only";

import { BusinessDocumentType, type SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import { listDocumentFieldValues } from "@/features/industry-fields/server/repository";
import { EstimatePdfStatus, type EstimatePdf } from "@prisma/client";

import { buildEstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import type { EstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import { PDF_TEMPLATE_REVISION } from "@/pdf/lib/pdf-template-revision";
import { resolvePdfLogoDataUri } from "@/pdf/lib/resolve-pdf-logo-data-uri";
import { renderEstimatePdfBuffer } from "@/pdf/server/render-estimate-pdf";
import { needsEstimatePdfStorageHeal } from "@/features/estimates/server/pdf-storage-service";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import type { Locale } from "@/lib/locale";
import { getVersionWithTree } from "@/features/estimates/server/repository";
import { getWorkspacePlan } from "@/server/billing/entitlement-service";

/** Watermarking is driven by the WORKSPACE plan (workspace billing), not the exporting user. */
export async function getWorkspaceSubscriptionPlan(
  workspaceId: string,
): Promise<SubscriptionPlan> {
  return getWorkspacePlan(workspaceId);
}

export async function loadEstimatePdfGenerationContext(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  locale: Locale;
  userId: string;
}): Promise<EstimatePdfViewModel> {
  const [estimate, versionTree, workspace, workspacePlan] = await Promise.all([
    prisma.estimate.findFirst({
      where: {
        id: input.estimateId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
      include: {
        estimateRequest: {
          select: {
            id: true,
            requestNumber: true,
            customerData: true,
            address: true,
          },
        },
      },
    }),
    getVersionWithTree(input.versionId, input.workspaceId),
    prisma.workspace.findFirst({
      where: { id: input.workspaceId, deletedAt: null },
      include: { settings: true },
    }),
    getWorkspaceSubscriptionPlan(input.workspaceId),
  ]);

  if (!estimate || !versionTree || !workspace) {
    throw new Error("Estimate context not found.");
  }

  if (versionTree.estimateId !== estimate.id) {
    throw new Error("Version does not belong to estimate.");
  }

  const requestFieldValues = estimate.estimateRequest
    ? await listDocumentFieldValues({
        workspaceId: input.workspaceId,
        documentType: BusinessDocumentType.ESTIMATE_REQUEST,
        documentId: estimate.estimateRequest.id,
      })
    : [];

  const propertyTypeValue = requestFieldValues.find((field) => field.fieldKey === "property_type");
  const floorAreaValue = requestFieldValues.find(
    (field) => field.fieldKey === "area_size" || field.fieldKey === "floor_area",
  );

  const rawPropertyType = propertyTypeValue ? readTypedFieldValue(propertyTypeValue) : null;
  const rawFloorArea = floorAreaValue ? readTypedFieldValue(floorAreaValue) : null;

  const brandingResult = workspaceBrandingSchema.safeParse(workspace.settings?.branding ?? {});
  const branding = brandingResult.success ? brandingResult.data : null;

  return buildEstimatePdfViewModel({
    locale: input.locale,
    currency: estimate.currency,
    requestNumber: estimate.estimateRequest?.requestNumber ?? null,
    estimateId: estimate.id,
    customerData: estimate.estimateRequest?.customerData,
    requestAddress: estimate.estimateRequest?.address,
    propertyTypeLabel:
      typeof rawPropertyType === "string" && rawPropertyType.length > 0
        ? getIndustryOptionLabel("property_type", rawPropertyType, input.locale, "label")
        : null,
    floorArea: (() => {
      if (typeof rawFloorArea === "number" && Number.isFinite(rawFloorArea)) {
        return rawFloorArea;
      }
      if (typeof rawFloorArea === "string" && rawFloorArea.trim().length > 0) {
        const parsed = Number.parseFloat(rawFloorArea.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    })(),
    workspace: {
      name: workspace.name,
      settings: workspace.settings,
    },
    brandingPrimaryColor: branding?.primaryColor ?? null,
    brandingAccentColor: branding?.accentColor ?? null,
    versionNumber: versionTree.versionNumber,
    marginPercent: Number(versionTree.marginPercent),
    sections: versionTree.sections.map((section) => ({
      title: section.title,
      sortOrder: section.sortOrder,
      lineItems: section.lineItems.map((item) => ({
        name: item.name,
        unit: item.unit ?? "",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
        sortOrder: item.sortOrder,
      })),
    })),
    userPlan: workspacePlan,
  });
}

export async function renderEstimatePdfForVersion(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  locale: Locale;
  userId: string;
}): Promise<Buffer> {
  const viewModel = await loadEstimatePdfGenerationContext(input);
  const logoDataUri = await resolvePdfLogoDataUri({
    logoUrl: viewModel.logoUrl,
    logoStorageKey: viewModel.logoStorageKey,
  });

  return renderEstimatePdfBuffer({
    ...viewModel,
    logoDataUri,
  });
}

export function isEstimatePdfFresh(input: {
  generatedAt: Date;
  versionUpdatedAt: Date;
  generatedLocale: string | null | undefined;
  requestLocale: Locale;
  pdfTemplateRevision: number | null | undefined;
}): boolean {
  if (!input.generatedLocale || input.generatedLocale !== input.requestLocale) {
    return false;
  }

  if (input.pdfTemplateRevision !== PDF_TEMPLATE_REVISION) {
    return false;
  }

  return input.generatedAt.getTime() >= input.versionUpdatedAt.getTime();
}

type EstimatePdfDownloadRecord = Pick<
  EstimatePdf,
  "status" | "fileKey" | "storageCustomId" | "generatedAt" | "generatedLocale" | "pdfTemplateRevision"
>;

/** READY row with valid UploadThing keys — used while polling an in-flight export. */
export function isEstimatePdfAvailableForDownload(
  existing: EstimatePdfDownloadRecord,
  workspaceId: string,
  estimatePdfId: string,
): boolean {
  return (
    existing.status === EstimatePdfStatus.READY &&
    !needsEstimatePdfStorageHeal(existing, workspaceId, estimatePdfId)
  );
}

/** Cached PDF can be reused without regenerating (export action fast path). */
export function isEstimatePdfCacheHit(
  existing: EstimatePdfDownloadRecord,
  workspaceId: string,
  estimatePdfId: string,
  versionUpdatedAt: Date,
  requestLocale: Locale,
): boolean {
  return (
    isEstimatePdfAvailableForDownload(existing, workspaceId, estimatePdfId) &&
    isEstimatePdfFresh({
      generatedAt: existing.generatedAt,
      versionUpdatedAt,
      generatedLocale: existing.generatedLocale,
      requestLocale,
      pdfTemplateRevision: existing.pdfTemplateRevision,
    })
  );
}
