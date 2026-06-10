import type { PaymentInstallmentStatus } from "@/features/estimates/lib/payment-installment-status";
import type { PaymentListPageItem } from "@/features/payments/server/list-payments-page-data";

export type PaymentListStatusTab = "ALL" | PaymentInstallmentStatus;

export type PaymentListDateRange = {
  from: Date | null;
  to: Date | null;
};

export const EMPTY_PAYMENT_LIST_DATE_RANGE: PaymentListDateRange = {
  from: null,
  to: null,
};

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(item: PaymentListPageItem, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    item.installment.name,
    item.installment.note,
    item.estimate.title,
    item.estimate.requestNumber,
    item.listContext.customerName,
    item.listContext.customerLocation,
    item.listContext.investmentDescription,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function matchesStatusTab(item: PaymentListPageItem, tab: PaymentListStatusTab): boolean {
  if (tab === "ALL") {
    return true;
  }

  return item.status === tab;
}

function matchesDateRange(item: PaymentListPageItem, range: PaymentListDateRange): boolean {
  if (!range.from && !range.to) {
    return true;
  }

  if (!item.installment.dueDate) {
    return false;
  }

  const due = new Date(`${item.installment.dueDate}T12:00:00`);

  if (range.from && due < range.from) {
    return false;
  }

  if (range.to && due > range.to) {
    return false;
  }

  return true;
}

export function hasActivePaymentDateRange(range: PaymentListDateRange): boolean {
  return range.from !== null || range.to !== null;
}

export function paymentIsVisible(
  item: PaymentListPageItem,
  input: {
    searchQuery: string;
    statusTab: PaymentListStatusTab;
    dateRange: PaymentListDateRange;
  },
): boolean {
  const query = normalizeSearch(input.searchQuery);

  return (
    matchesSearch(item, query) &&
    matchesStatusTab(item, input.statusTab) &&
    matchesDateRange(item, input.dateRange)
  );
}
