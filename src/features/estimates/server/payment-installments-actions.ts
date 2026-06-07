"use server";

import "server-only";

import {
  buildPaymentScheduleFromPreset,
  type PaymentSchedulePresetId,
} from "@/features/estimates/lib/payment-schedule-presets";
import {
  serializePaymentInstallment,
  serializePaymentInstallments,
} from "@/features/estimates/lib/serialize-payment-installments";
import type { PaymentInstallmentClient } from "@/features/estimates/lib/serialize-payment-installments";
import {
  createPaymentInstallmentSchema,
  generatePaymentScheduleSchema,
  recordPaymentInstallmentSchema,
  reorderPaymentInstallmentsSchema,
  updatePaymentInstallmentSchema,
} from "@/features/estimates/schemas/payment-installment";
import { revalidateEstimatePaths } from "@/features/estimates/server/revalidate-estimate-paths";
import {
  assertEstimateInWorkspace,
  createPaymentInstallment,
  deletePaymentInstallment,
  listPaymentInstallmentsByEstimateId,
  recordPaymentInstallment,
  reorderPaymentInstallments,
  replacePaymentInstallments,
  setPaymentInstallmentPaidState,
  updatePaymentInstallment,
} from "@/features/estimates/server/payment-installments-repository";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

type ActionContext = {
  estimateId: string;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
};

function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof PermissionError) {
    return { success: false, error: error.message };
  }
  console.error("[payment installments action]", error);
  return { success: false, error: "Something went wrong." };
}

async function authorize(ctx: ActionContext) {
  const user = await requireAuth(ctx.locale);
  await requireRole(user, ctx.workspaceId, "VIEWER");
  await assertEstimateInWorkspace(ctx.estimateId, ctx.workspaceId);
  return user;
}

export async function createPaymentInstallmentAction(
  input: ActionContext & {
    name: string;
    amount: number;
    dueDate?: string;
    note?: string;
  },
): Promise<ActionResult<{ installment: PaymentInstallmentClient }>> {
  try {
    const parsed = createPaymentInstallmentSchema.safeParse({
      name: input.name,
      amount: input.amount,
      dueDate: input.dueDate,
      note: input.note,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid payment installment." };
    }

    await authorize(input);

    const row = await createPaymentInstallment({
      estimateId: input.estimateId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      note: parsed.data.note,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { installment: serializePaymentInstallment(row) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updatePaymentInstallmentAction(
  input: ActionContext & {
    installmentId: string;
    name: string;
    amount: number;
    dueDate?: string;
    note?: string;
  },
): Promise<ActionResult<{ installment: PaymentInstallmentClient }>> {
  try {
    const parsed = updatePaymentInstallmentSchema.safeParse({
      name: input.name,
      amount: input.amount,
      dueDate: input.dueDate,
      note: input.note,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid payment installment." };
    }

    await authorize(input);

    const row = await updatePaymentInstallment({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      note: parsed.data.note,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { installment: serializePaymentInstallment(row) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePaymentInstallmentAction(
  input: ActionContext & { installmentId: string },
): Promise<ActionResult<{ ok: true }>> {
  try {
    await authorize(input);

    await deletePaymentInstallment({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return { success: true, data: { ok: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function recordPaymentInstallmentAction(
  input: ActionContext & {
    installmentId: string;
    paymentAmount: number;
    note?: string;
  },
): Promise<ActionResult<{ installment: PaymentInstallmentClient }>> {
  try {
    const parsed = recordPaymentInstallmentSchema.safeParse({
      paymentAmount: input.paymentAmount,
      note: input.note,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid payment amount." };
    }

    await authorize(input);

    const row = await recordPaymentInstallment({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      paymentAmount: parsed.data.paymentAmount,
      note: parsed.data.note,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { installment: serializePaymentInstallment(row) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function markPaymentInstallmentPaidAction(
  input: ActionContext & { installmentId: string },
): Promise<ActionResult<{ installment: PaymentInstallmentClient }>> {
  try {
    await authorize(input);

    const rows = await listPaymentInstallmentsByEstimateId(input.estimateId);
    const existing = rows.find((row) => row.id === input.installmentId);

    if (!existing) {
      return { success: false, error: "Payment installment not found." };
    }

    const row = await setPaymentInstallmentPaidState({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      paidAmount: Number(existing.amount.toString()),
      paidAt: new Date(),
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { installment: serializePaymentInstallment(row) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function markPaymentInstallmentUnpaidAction(
  input: ActionContext & { installmentId: string },
): Promise<ActionResult<{ installment: PaymentInstallmentClient }>> {
  try {
    await authorize(input);

    const row = await setPaymentInstallmentPaidState({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      paidAmount: 0,
      paidAt: null,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { installment: serializePaymentInstallment(row) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderPaymentInstallmentsAction(
  input: ActionContext & { installmentIds: string[] },
): Promise<ActionResult<{ installments: PaymentInstallmentClient[] }>> {
  try {
    const parsed = reorderPaymentInstallmentsSchema.safeParse({
      installmentIds: input.installmentIds,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid installment order." };
    }

    await authorize(input);

    const rows = await reorderPaymentInstallments({
      estimateId: input.estimateId,
      installmentIds: parsed.data.installmentIds,
    });

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { installments: serializePaymentInstallments(rows) },
    };
  } catch (error) {
    return toActionError(error);
  }
}

export async function generatePaymentScheduleAction(
  input: ActionContext & {
    presetId: PaymentSchedulePresetId;
    customerTotalGross: number;
    presetNames: Record<string, string>;
  },
): Promise<ActionResult<{ installments: PaymentInstallmentClient[] }>> {
  try {
    const parsed = generatePaymentScheduleSchema.safeParse({
      presetId: input.presetId,
      customerTotalGross: input.customerTotalGross,
    });

    if (!parsed.success) {
      return { success: false, error: "Invalid payment schedule." };
    }

    await authorize(input);

    // Customer-facing total gross only — see buildPaymentScheduleFromPreset() for the same rule.
    const generated = buildPaymentScheduleFromPreset(
      parsed.data.presetId,
      parsed.data.customerTotalGross,
    );

    const rows = await replacePaymentInstallments(
      input.estimateId,
      generated.map((item) => ({
        name: input.presetNames[item.nameKey] ?? item.nameKey,
        amount: item.amount,
        dueDate: item.dueDate,
      })),
    );

    revalidateEstimatePaths(input.locale, input.workspaceSlug, input.estimateId);

    return {
      success: true,
      data: { installments: serializePaymentInstallments(rows) },
    };
  } catch (error) {
    return toActionError(error);
  }
}
