import { z } from "zod";

export const PAYMENT_INSTALLMENT_NAME_MAX_LENGTH = 120;
export const PAYMENT_INSTALLMENT_NOTE_MAX_LENGTH = 500;
export const PAYMENT_INSTALLMENT_AMOUNT_MAX = 999_999_999.99;

export const paymentInstallmentNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(PAYMENT_INSTALLMENT_NAME_MAX_LENGTH);

export const paymentInstallmentAmountSchema = z
  .number()
  .positive("Amount must be greater than zero.")
  .max(PAYMENT_INSTALLMENT_AMOUNT_MAX);

export const paymentInstallmentDueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.")
  .optional();

export const paymentInstallmentNoteSchema = z
  .string()
  .trim()
  .max(PAYMENT_INSTALLMENT_NOTE_MAX_LENGTH)
  .optional();

export const createPaymentInstallmentSchema = z.object({
  name: paymentInstallmentNameSchema,
  amount: paymentInstallmentAmountSchema,
  dueDate: paymentInstallmentDueDateSchema,
  note: paymentInstallmentNoteSchema,
});

export const updatePaymentInstallmentSchema = createPaymentInstallmentSchema;

export const generatePaymentScheduleSchema = z.object({
  presetId: z.enum(["100", "50-50", "30-40-30", "20-30-30-20"]),
  customerTotalGross: paymentInstallmentAmountSchema,
});

export const reorderPaymentInstallmentsSchema = z.object({
  installmentIds: z.array(z.string().cuid()).min(1),
});

export const recordPaymentInstallmentSchema = z.object({
  paymentAmount: paymentInstallmentAmountSchema,
  note: paymentInstallmentNoteSchema,
});

export type CreatePaymentInstallmentInput = z.infer<typeof createPaymentInstallmentSchema>;
export type UpdatePaymentInstallmentInput = z.infer<typeof updatePaymentInstallmentSchema>;
