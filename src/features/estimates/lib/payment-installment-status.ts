export type PaymentInstallmentStatus = "PAID" | "PARTIAL" | "OVERDUE" | "PENDING";

export type PaymentInstallmentStatusInput = {
  amount: number;
  paidAmount: number;
  dueDate: string | null;
};

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isInstallmentFullyPaid(installment: PaymentInstallmentStatusInput): boolean {
  return installment.paidAmount >= installment.amount;
}

export function getInstallmentRemainingAmount(installment: PaymentInstallmentStatusInput): number {
  return Math.max(0, installment.amount - installment.paidAmount);
}

export function isInstallmentOverdue(installment: PaymentInstallmentStatusInput): boolean {
  if (isInstallmentFullyPaid(installment)) {
    return false;
  }

  if (installment.dueDate == null) {
    return false;
  }

  const due = new Date(installment.dueDate);
  return due < startOfToday();
}

export function getInstallmentStatus(
  installment: PaymentInstallmentStatusInput,
): PaymentInstallmentStatus {
  if (isInstallmentFullyPaid(installment)) {
    return "PAID";
  }

  if (installment.paidAmount > 0) {
    return "PARTIAL";
  }

  if (isInstallmentOverdue(installment)) {
    return "OVERDUE";
  }

  return "PENDING";
}
