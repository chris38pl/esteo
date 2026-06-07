import {
  getInstallmentRemainingAmount,
  getInstallmentStatus,
  isInstallmentOverdue,
} from "@/features/estimates/lib/payment-installment-status";

export type PaymentInstallmentSummaryInput = {
  amount: number;
  paidAmount: number;
  dueDate: string | null;
};

export type PaymentSummary = {
  paid: number;
  remaining: number;
  overdueAmount: number;
  progressPercent: number;
  overdueCount: number;
};

export function computePaymentSummary(
  customerTotalGross: number,
  installments: PaymentInstallmentSummaryInput[],
): PaymentSummary {
  let paid = 0;
  let overdueAmount = 0;
  let overdueCount = 0;

  for (const installment of installments) {
    paid += installment.paidAmount;

    if (isInstallmentOverdue(installment)) {
      overdueAmount += getInstallmentRemainingAmount(installment);
      overdueCount += 1;
    }
  }

  const remaining = Math.max(0, customerTotalGross - paid);
  const progressPercent =
    customerTotalGross > 0 ? Math.min(100, (paid / customerTotalGross) * 100) : 0;

  return {
    paid,
    remaining,
    overdueAmount,
    progressPercent,
    overdueCount,
  };
}
