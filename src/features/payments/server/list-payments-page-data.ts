import { BusinessDocumentType } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryOptionLabel } from "@/features/estimate-requests/config/industry-option-labels";
import {
  parseRequestAddress,
  parseRequestCustomerData,
} from "@/features/estimate-requests/lib/parse-request-json";
import { readTypedFieldValue } from "@/features/industry-fields/server/map-field-value";
import {
  getInstallmentRemainingAmount,
  getInstallmentStatus,
  type PaymentInstallmentStatus,
} from "@/features/estimates/lib/payment-installment-status";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import { serializePaymentInstallment } from "@/features/estimates/lib/serialize-payment-installments";
import type { Locale } from "@/lib/locale";

export type PaymentListPageItem = {
  installment: PaymentInstallmentClient;
  status: PaymentInstallmentStatus;
  remainingAmount: number;
  estimate: {
    id: string;
    title: string | null;
    currency: string;
    requestNumber: string | null;
    totalGross: number;
  };
  listContext: {
    customerName: string | null;
    customerLocation: string | null;
    investmentDescription: string | null;
  };
};

export async function loadPaymentsForListPage(
  workspaceId: string,
  locale: Locale,
): Promise<PaymentListPageItem[]> {
  const rows = await prisma.paymentInstallment.findMany({
    where: {
      estimate: {
        workspaceId,
        deletedAt: null,
      },
    },
    include: {
      estimate: {
        select: {
          id: true,
          title: true,
          currency: true,
          estimateRequest: {
            select: {
              id: true,
              requestNumber: true,
              customerData: true,
              address: true,
            },
          },
          latestVersion: {
            select: {
              totalGross: true,
            },
          },
        },
      },
    },
    orderBy: [{ dueDate: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const requestIds = rows
    .map((row) => row.estimate.estimateRequest?.id)
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

  return rows.map((row) => {
    const serialized = serializePaymentInstallment(row);
    const status = getInstallmentStatus({
      amount: serialized.amount,
      paidAmount: serialized.paidAmount,
      dueDate: serialized.dueDate,
    });
    const request = row.estimate.estimateRequest;
    const customer = parseRequestCustomerData(request?.customerData);
    const address = parseRequestAddress(request?.address);
    const rawProperty = request?.id ? propertyByRequestId.get(request.id) : null;
    const propertyType =
      typeof rawProperty === "string" && rawProperty.length > 0
        ? getIndustryOptionLabel("property_type", rawProperty, locale, "label")
        : null;

    const street = address?.streetAddress ?? null;
    const city = address?.city ?? null;
    const investmentParts = [street, city, propertyType].filter(Boolean);

    return {
      installment: serialized,
      status,
      remainingAmount: getInstallmentRemainingAmount({
        amount: serialized.amount,
        paidAmount: serialized.paidAmount,
        dueDate: serialized.dueDate,
      }),
      estimate: {
        id: row.estimate.id,
        title: row.estimate.title,
        currency: row.estimate.currency,
        requestNumber: request?.requestNumber ?? null,
        totalGross: row.estimate.latestVersion
          ? Number(row.estimate.latestVersion.totalGross.toString())
          : 0,
      },
      listContext: {
        customerName: customer?.fullName ?? null,
        customerLocation: [street, city].filter(Boolean).join(", ") || null,
        investmentDescription: investmentParts.length > 0 ? investmentParts.join(", ") : null,
      },
    };
  });
}
