import { BusinessDocumentType } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import {
  parseRequestAddress,
  parseRequestCustomerData,
} from "@/features/estimate-requests/lib/parse-request-json";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import {
  listEstimates,
  type EstimateListItem,
} from "@/features/estimates/server/repository";
import { resolveUserEmailsByIds } from "@/features/users/server/resolve-user-emails";
import type { Locale } from "@/lib/locale";

type EstimateListLatestVersion = NonNullable<EstimateListItem["latestVersion"]> & {
  totalNet: number;
  totalGross: number;
};

export type EstimateListPageItem = Omit<EstimateListItem, "latestVersion"> & {
  latestVersion: EstimateListLatestVersion | null;
  listContext: {
    investmentPropertyType: string | null;
    customerName: string | null;
    customerEmail: string | null;
    investmentStreet: string | null;
    investmentCity: string | null;
    updatedByEmail: string | null;
  };
};

export async function loadEstimatesForListPage(
  workspaceId: string,
  locale: Locale,
): Promise<EstimateListPageItem[]> {
  const estimates = await listEstimates(workspaceId);

  const requestIds = estimates
    .map((estimate) => estimate.estimateRequest?.id)
    .filter((id): id is string => Boolean(id));

  const propertyRows =
    requestIds.length > 0
      ? await prisma.documentFieldValue.findMany({
          where: {
            workspaceId,
            documentType: BusinessDocumentType.ESTIMATE_REQUEST,
            documentId: { in: requestIds },
            fieldKey: "property_type",
          },
        })
      : [];

  const propertyByRequestId = new Map(
    propertyRows.map((row) => [row.documentId, readTypedFieldValue(row)]),
  );

  const userEmails = await resolveUserEmailsByIds(
    estimates.map((estimate) => estimate.latestVersion?.createdByUserId),
  );

  return estimates.map((estimate) => {
    const request = estimate.estimateRequest;
    const customer = parseRequestCustomerData(request?.customerData);
    const address = parseRequestAddress(request?.address);
    const rawProperty = request?.id ? propertyByRequestId.get(request.id) : null;
    const investmentPropertyType =
      typeof rawProperty === "string" && rawProperty.length > 0
        ? getIndustryOptionLabel("property_type", rawProperty, locale, "label")
        : null;

    return {
      ...estimate,
      listContext: {
        investmentPropertyType,
        customerName: customer?.fullName ?? null,
        customerEmail: customer?.email ?? null,
        investmentStreet: address?.streetAddress ?? null,
        investmentCity: address?.city ?? null,
        updatedByEmail:
          userEmails.get(estimate.latestVersion?.createdByUserId ?? "") ?? null,
      },
    };
  });
}
