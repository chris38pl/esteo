import type { PaymentInstallmentRow } from "@/features/estimates/server/payment-installments-repository";

export type PaymentInstallmentClient = {
  id: string;
  estimateId: string;
  name: string;
  amount: number;
  paidAmount: number;
  dueDate: string | null;
  paidAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

function decimalToNumber(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function formatDateOnly(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

export function serializePaymentInstallment(
  row: PaymentInstallmentRow,
): PaymentInstallmentClient {
  return {
    id: row.id,
    estimateId: row.estimateId,
    name: row.name,
    amount: decimalToNumber(row.amount),
    paidAmount: decimalToNumber(row.paidAmount),
    dueDate: formatDateOnly(row.dueDate),
    paidAt: row.paidAt?.toISOString() ?? null,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializePaymentInstallments(
  rows: PaymentInstallmentRow[],
): PaymentInstallmentClient[] {
  return rows.map(serializePaymentInstallment);
}
