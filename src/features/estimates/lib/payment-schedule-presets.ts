export type PaymentSchedulePresetId =
  | "100"
  | "50-50"
  | "30-40-30"
  | "20-30-30-20";

export type PaymentSchedulePresetNameKey =
  | "fullPayment"
  | "advancePayment"
  | "finalAcceptance"
  | "implementation"
  | "stage1"
  | "stage2";

export type GeneratedPaymentInstallment = {
  nameKey: PaymentSchedulePresetNameKey;
  amount: number;
  dueDate: Date;
};

const PRESET_SPLITS: Record<PaymentSchedulePresetId, number[]> = {
  "100": [100],
  "50-50": [50, 50],
  "30-40-30": [30, 40, 30],
  "20-30-30-20": [20, 30, 30, 20],
};

const PRESET_NAME_KEYS: Record<PaymentSchedulePresetId, PaymentSchedulePresetNameKey[]> = {
  "100": ["fullPayment"],
  "50-50": ["advancePayment", "finalAcceptance"],
  "30-40-30": ["advancePayment", "implementation", "finalAcceptance"],
  "20-30-30-20": ["advancePayment", "stage1", "stage2", "finalAcceptance"],
};

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

// IMPORTANT: base all installment amounts on the customer-facing estimate total (totalGross).
// Never use totalNet, cost basis, or margin-internal values — installments must match what the customer sees.
export function buildPaymentScheduleFromPreset(
  presetId: PaymentSchedulePresetId,
  customerTotalGross: number,
  startDate: Date = new Date(),
): GeneratedPaymentInstallment[] {
  const splits = PRESET_SPLITS[presetId];
  const nameKeys = PRESET_NAME_KEYS[presetId];

  const amounts: number[] = [];
  let allocated = 0;

  for (let i = 0; i < splits.length; i++) {
    if (i === splits.length - 1) {
      amounts.push(roundMoney(customerTotalGross - allocated));
    } else {
      const portion = roundMoney((customerTotalGross * splits[i]) / 100);
      amounts.push(portion);
      allocated += portion;
    }
  }

  const today = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  return splits.map((_, index) => ({
    nameKey: nameKeys[index],
    amount: amounts[index],
    dueDate: addMonths(today, index),
  }));
}

export const PAYMENT_SCHEDULE_PRESET_IDS: PaymentSchedulePresetId[] = [
  "100",
  "50-50",
  "30-40-30",
  "20-30-30-20",
];
