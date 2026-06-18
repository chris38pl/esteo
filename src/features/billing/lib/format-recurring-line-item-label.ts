import type { SubscriptionPlan } from "@prisma/client";

import type { RecurringLineItem } from "@/features/billing/lib/subscription-impact";
import { SEAT_UNIT_COUNT, STORAGE_UNIT_BYTES } from "@/server/billing/addon-catalog";
import { formatBytes } from "@/features/attachments/lib/format-bytes";

type LineItemTranslator = (
  key: "lineItem.plan" | "lineItem.storagePack" | "lineItem.seatPack",
  values?: { count?: number; amount?: string },
) => string;

export function formatRecurringLineItemLabel(
  item: RecurringLineItem,
  plan: SubscriptionPlan | null,
  planLabels: Record<SubscriptionPlan, string>,
  t: LineItemTranslator,
): string {
  switch (item.kind) {
    case "plan":
      return plan ? planLabels[plan] : t("lineItem.plan");
    case "addon_storage": {
      const count = item.quantity ?? 0;
      const bytes = count * STORAGE_UNIT_BYTES;
      return t("lineItem.storagePack", {
        count,
        amount: formatBytes(bytes),
      });
    }
    case "addon_seats": {
      const count = item.quantity ?? 0;
      const users = count * SEAT_UNIT_COUNT;
      return t("lineItem.seatPack", { count, amount: String(users) });
    }
  }
}
