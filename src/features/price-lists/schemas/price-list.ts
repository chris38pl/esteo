import { z } from "zod";

import {
  PRICE_LIST_CURRENCY_LENGTH,
  PRICE_LIST_ITEM_NAME_MAX_LENGTH,
  PRICE_LIST_MAX_ITEMS,
  PRICE_LIST_NAME_MAX_LENGTH,
  PRICE_LIST_NOTE_MAX_LENGTH,
  PRICE_LIST_UNIT_MAX_LENGTH,
} from "@/features/price-lists/lib/price-list-limits";

const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,4})?$/);

export const priceListItemInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(PRICE_LIST_ITEM_NAME_MAX_LENGTH),
  unit: z.string().trim().min(1).max(PRICE_LIST_UNIT_MAX_LENGTH),
  unitPrice: decimalStringSchema,
  vatRate: decimalStringSchema.optional().nullable(),
  note: z.string().trim().max(PRICE_LIST_NOTE_MAX_LENGTH).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const priceListInputSchema = z.object({
  name: z.string().trim().min(1).max(PRICE_LIST_NAME_MAX_LENGTH),
  currency: z
    .string()
    .trim()
    .length(PRICE_LIST_CURRENCY_LENGTH)
    .transform((value) => value.toUpperCase())
    .default("PLN"),
  items: z.array(priceListItemInputSchema).min(1).max(PRICE_LIST_MAX_ITEMS),
});

export type PriceListInput = z.infer<typeof priceListInputSchema>;
