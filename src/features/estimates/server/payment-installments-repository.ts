import "server-only";

import { prisma } from "@/db/client";
import { PermissionError } from "@/server/permissions/errors";

export { assertEstimateInWorkspace } from "@/features/estimates/server/notes-repository";

export type PaymentInstallmentRow = {
  id: string;
  estimateId: string;
  name: string;
  amount: { toString(): string };
  paidAmount: { toString(): string };
  dueDate: Date | null;
  paidAt: Date | null;
  note: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const selectFields = {
  id: true,
  estimateId: true,
  name: true,
  amount: true,
  paidAmount: true,
  dueDate: true,
  paidAt: true,
  note: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,
} as const;

const listOrderBy = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

function parseDueDate(dueDate?: string): Date | null {
  if (!dueDate) return null;
  return new Date(`${dueDate}T00:00:00.000Z`);
}

async function nextSortOrder(estimateId: string): Promise<number> {
  const result = await prisma.paymentInstallment.aggregate({
    where: { estimateId },
    _max: { sortOrder: true },
  });

  return (result._max.sortOrder ?? -1) + 1;
}

export async function listPaymentInstallmentsByEstimateId(
  estimateId: string,
): Promise<PaymentInstallmentRow[]> {
  return prisma.paymentInstallment.findMany({
    where: { estimateId },
    orderBy: listOrderBy,
    select: selectFields,
  });
}

export async function createPaymentInstallment(input: {
  estimateId: string;
  name: string;
  amount: number;
  dueDate?: string;
  note?: string;
}): Promise<PaymentInstallmentRow> {
  const sortOrder = await nextSortOrder(input.estimateId);

  return prisma.paymentInstallment.create({
    data: {
      estimateId: input.estimateId,
      name: input.name,
      amount: input.amount,
      dueDate: parseDueDate(input.dueDate),
      note: input.note?.trim() || null,
      sortOrder,
    },
    select: selectFields,
  });
}

export async function updatePaymentInstallment(input: {
  installmentId: string;
  estimateId: string;
  name: string;
  amount: number;
  dueDate?: string;
  note?: string;
}): Promise<PaymentInstallmentRow> {
  const existing = await prisma.paymentInstallment.findFirst({
    where: {
      id: input.installmentId,
      estimateId: input.estimateId,
    },
    select: { id: true, paidAt: true, paidAmount: true, amount: true },
  });

  if (!existing) {
    throw new PermissionError("Payment installment not found.");
  }

  const currentPaid = Number(existing.paidAmount.toString());
  const nextPaid = Math.min(currentPaid, input.amount);
  const isFullyPaid = nextPaid >= input.amount;

  return prisma.paymentInstallment.update({
    where: { id: input.installmentId },
    data: {
      name: input.name,
      amount: input.amount,
      dueDate: parseDueDate(input.dueDate),
      note: input.note?.trim() || null,
      paidAmount: isFullyPaid ? input.amount : nextPaid,
      paidAt: isFullyPaid ? existing.paidAt ?? new Date() : null,
    },
    select: selectFields,
  });
}

export async function deletePaymentInstallment(input: {
  installmentId: string;
  estimateId: string;
}): Promise<void> {
  const existing = await prisma.paymentInstallment.findFirst({
    where: {
      id: input.installmentId,
      estimateId: input.estimateId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new PermissionError("Payment installment not found.");
  }

  await prisma.paymentInstallment.delete({
    where: { id: input.installmentId },
  });
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function recordPaymentInstallment(input: {
  installmentId: string;
  estimateId: string;
  paymentAmount: number;
  note?: string;
}): Promise<PaymentInstallmentRow> {
  const existing = await prisma.paymentInstallment.findFirst({
    where: {
      id: input.installmentId,
      estimateId: input.estimateId,
    },
    select: { id: true, amount: true, paidAmount: true, note: true },
  });

  if (!existing) {
    throw new PermissionError("Payment installment not found.");
  }

  const installmentAmount = Number(existing.amount.toString());
  const currentPaid = Number(existing.paidAmount.toString());
  const remaining = Math.max(0, installmentAmount - currentPaid);

  if (remaining <= 0) {
    throw new PermissionError("Installment is already fully paid.");
  }

  if (input.paymentAmount > remaining) {
    throw new PermissionError("Payment exceeds the remaining installment amount.");
  }

  const nextPaid = roundMoney(currentPaid + input.paymentAmount);
  const isFullyPaid = nextPaid >= installmentAmount;
  const nextNote = input.note?.trim()
    ? [existing.note?.trim(), input.note.trim()].filter(Boolean).join("\n")
    : existing.note;

  return prisma.paymentInstallment.update({
    where: { id: input.installmentId },
    data: {
      paidAmount: isFullyPaid ? installmentAmount : nextPaid,
      paidAt: isFullyPaid ? new Date() : null,
      note: nextNote,
    },
    select: selectFields,
  });
}

export async function setPaymentInstallmentPaidState(input: {
  installmentId: string;
  estimateId: string;
  paidAmount: number;
  paidAt: Date | null;
}): Promise<PaymentInstallmentRow> {
  const existing = await prisma.paymentInstallment.findFirst({
    where: {
      id: input.installmentId,
      estimateId: input.estimateId,
    },
    select: { id: true },
  });

  if (!existing) {
    throw new PermissionError("Payment installment not found.");
  }

  return prisma.paymentInstallment.update({
    where: { id: input.installmentId },
    data: {
      paidAmount: input.paidAmount,
      paidAt: input.paidAt,
    },
    select: selectFields,
  });
}

export async function reorderPaymentInstallments(input: {
  estimateId: string;
  installmentIds: string[];
}): Promise<PaymentInstallmentRow[]> {
  const existing = await prisma.paymentInstallment.findMany({
    where: { estimateId: input.estimateId },
    select: { id: true },
    orderBy: listOrderBy,
  });

  const existingIds = existing.map((row) => row.id);
  if (
    existingIds.length !== input.installmentIds.length ||
    !input.installmentIds.every((id) => existingIds.includes(id))
  ) {
    throw new PermissionError("Invalid installment order.");
  }

  await prisma.$transaction(
    input.installmentIds.map((id, index) =>
      prisma.paymentInstallment.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  return listPaymentInstallmentsByEstimateId(input.estimateId);
}

export async function replacePaymentInstallments(
  estimateId: string,
  rows: Array<{
    name: string;
    amount: number;
    dueDate: Date;
    note?: string | null;
  }>,
): Promise<PaymentInstallmentRow[]> {
  return prisma.$transaction(async (tx) => {
    await tx.paymentInstallment.deleteMany({
      where: { estimateId },
    });

    if (rows.length === 0) {
      return [];
    }

    await tx.paymentInstallment.createMany({
      data: rows.map((row, index) => ({
        estimateId,
        name: row.name,
        amount: row.amount,
        dueDate: row.dueDate,
        note: row.note ?? null,
        sortOrder: index,
      })),
    });

    return tx.paymentInstallment.findMany({
      where: { estimateId },
      orderBy: listOrderBy,
      select: selectFields,
    });
  });
}
