import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";

export function reorderPaymentInstallmentList(
  installments: PaymentInstallmentClient[],
  fromIndex: number,
  toIndex: number,
): PaymentInstallmentClient[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
    return installments;
  }

  const next = [...installments];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return installments;
  }

  next.splice(toIndex, 0, moved);
  return next;
}
