"use server";

import "server-only";

import { prisma } from "@/db/client";
import type { ActivityMetadata } from "@/features/estimates/lib/estimate-activity-types";
import {
  ESTIMATE_ACTIVITY_ACTIONS,
  type EstimateActivityAction,
} from "@/features/estimates/lib/estimate-activity-types";
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
import { logEstimateActivity } from "@/features/estimates/server/activity-log";
import { revalidateEstimatePaths } from "@/features/estimates/server/revalidate-estimate-paths";
import {
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

function toActivityCurrency(currency: string): ActivityMetadata["currency"] {
  return currency === "EUR" ? "EUR" : "PLN";
}

async function authorize(ctx: ActionContext) {
  const user = await requireAuth(ctx.locale);
  await requireRole(user, ctx.workspaceId, "VIEWER");

  const estimate = await prisma.estimate.findFirst({
    where: {
      id: ctx.estimateId,
      workspaceId: ctx.workspaceId,
      deletedAt: null,
    },
    select: { id: true, currency: true },
  });

  if (!estimate) {
    throw new PermissionError("Estimate not found.");
  }

  return { user, currency: toActivityCurrency(estimate.currency) };
}

async function logPaymentActivity(
  ctx: ActionContext,
  userId: string,
  action: EstimateActivityAction,
  metadata: ActivityMetadata,
): Promise<void> {
  await logEstimateActivity({
    estimateId: ctx.estimateId,
    workspaceId: ctx.workspaceId,
    actorType: "USER",
    actorUserId: userId,
    category: "FINANCIAL",
    action,
    metadata,
  });
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

    const { user, currency } = await authorize(input);

    const row = await createPaymentInstallment({
      estimateId: input.estimateId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      note: parsed.data.note,
    });

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_installment_added, {
      installmentName: parsed.data.name,
      installmentAmount: parsed.data.amount,
      currency,
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

    const { user, currency } = await authorize(input);

    const row = await updatePaymentInstallment({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      name: parsed.data.name,
      amount: parsed.data.amount,
      dueDate: parsed.data.dueDate,
      note: parsed.data.note,
    });

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_installment_updated, {
      installmentName: parsed.data.name,
      installmentAmount: parsed.data.amount,
      currency,
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
    const { user, currency } = await authorize(input);

    const rows = await listPaymentInstallmentsByEstimateId(input.estimateId);
    const existing = rows.find((row) => row.id === input.installmentId);

    if (!existing) {
      return { success: false, error: "Payment installment not found." };
    }

    await deletePaymentInstallment({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
    });

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_installment_deleted, {
      installmentName: existing.name,
      currency,
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

    const { user, currency } = await authorize(input);

    const rows = await listPaymentInstallmentsByEstimateId(input.estimateId);
    const existing = rows.find((row) => row.id === input.installmentId);

    if (!existing) {
      return { success: false, error: "Payment installment not found." };
    }

    const row = await recordPaymentInstallment({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      paymentAmount: parsed.data.paymentAmount,
      note: parsed.data.note,
    });

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_recorded, {
      installmentName: existing.name,
      paymentAmount: parsed.data.paymentAmount,
      currency,
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
    const { user, currency } = await authorize(input);

    const rows = await listPaymentInstallmentsByEstimateId(input.estimateId);
    const existing = rows.find((row) => row.id === input.installmentId);

    if (!existing) {
      return { success: false, error: "Payment installment not found." };
    }

    const paymentAmount = Number(existing.amount.toString());

    const row = await setPaymentInstallmentPaidState({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      paidAmount: paymentAmount,
      paidAt: new Date(),
    });

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_recorded, {
      installmentName: existing.name,
      paymentAmount,
      currency,
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
    const { user, currency } = await authorize(input);

    const rows = await listPaymentInstallmentsByEstimateId(input.estimateId);
    const existing = rows.find((row) => row.id === input.installmentId);

    if (!existing) {
      return { success: false, error: "Payment installment not found." };
    }

    const row = await setPaymentInstallmentPaidState({
      installmentId: input.installmentId,
      estimateId: input.estimateId,
      paidAmount: 0,
      paidAt: null,
    });

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_installment_unpaid, {
      installmentName: existing.name,
      currency,
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

    const { user } = await authorize(input);

    const rows = await reorderPaymentInstallments({
      estimateId: input.estimateId,
      installmentIds: parsed.data.installmentIds,
    });

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_installment_reordered, {
      installmentCount: rows.length,
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

    const { user, currency } = await authorize(input);

    // Customer-facing total gross only - see buildPaymentScheduleFromPreset() for the same rule.
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

    await logPaymentActivity(input, user.id, ESTIMATE_ACTIVITY_ACTIONS.payment_schedule_generated, {
      presetId: parsed.data.presetId,
      installmentCount: rows.length,
      currency,
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
