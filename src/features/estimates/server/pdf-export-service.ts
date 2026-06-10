import "server-only";

import { BusinessDocumentType, type SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import { listDocumentFieldValues } from "@/features/industry-fields/server/repository";
import { buildEstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import type { EstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import { renderEstimatePdfBuffer } from "@/pdf/server/render-estimate-pdf";
import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";
import type { Locale } from "@/lib/locale";
import { getVersionWithTree } from "@/features/estimates/server/repository";

export async function getUserSubscriptionPlan(userId: string): Promise<SubscriptionPlan> {
  const billingAccount = await prisma.billingAccount.findUnique({
    where: { ownerUserId: userId },
    include: { subscription: true },
  });

  return billingAccount?.subscription?.plan ?? "FREE";
}

export async function loadEstimatePdfGenerationContext(input: {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  locale: Locale;
  userId: string;
}): Promise<EstimatePdfViewModel> {
  const [estimate, versionTree, workspace, userPlan] = await Promise.all([
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
    getUserSubscriptionPlan(input.userId),
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
  const floorAreaValue = requestFieldValues.find((field) => field.fieldKey === "floor_area");

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
    floorArea: typeof rawFloorArea === "number" ? rawFloorArea : null,
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
    userPlan,
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
  return renderEstimatePdfBuffer(viewModel);
}

export function isEstimatePdfFresh(input: {
  generatedAt: Date;
  versionUpdatedAt: Date;
  generatedLocale: string | null | undefined;
  requestLocale: Locale;
}): boolean {
  if (!input.generatedLocale || input.generatedLocale !== input.requestLocale) {
    return false;
  }

  return input.generatedAt.getTime() >= input.versionUpdatedAt.getTime();
}
