import type { SerializedPriceList } from "@/features/workspace-configuration/server/service";
import {
  PRICE_LIST_CURRENCY_LENGTH,
  PRICE_LIST_MAX_ITEMS,
  isPriceListDecimalValue,
  normalizePriceListDecimalInput,
} from "@/features/price-lists/lib/price-list-limits";

export type PriceListItemDraft = {
  id: string;
  name: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  note: string;
  sortOrder: number;
};

export type PriceListEditorDraft = {
  name: string;
  currency: string;
  items: PriceListItemDraft[];
};

export function createPriceListDraftId(): string {
  return crypto.randomUUID();
}

function createEmptyPriceListItem(sortOrder: number): PriceListItemDraft {
  return {
    id: createPriceListDraftId(),
    name: "",
    unit: "",
    unitPrice: "",
    vatRate: "",
    note: "",
    sortOrder,
  };
}

export function hasPriceListDraftItemContent(item: PriceListItemDraft): boolean {
  return Boolean(
    item.name.trim() ||
      item.unit.trim() ||
      item.unitPrice.trim() ||
      item.vatRate.trim() ||
      item.note.trim(),
  );
}

export function isPriceListDraftItemComplete(item: PriceListItemDraft): boolean {
  return (
    Boolean(item.name.trim() && item.unit.trim()) &&
    isPriceListDecimalValue(item.unitPrice, true) &&
    isPriceListDecimalValue(item.vatRate, false)
  );
}

export function hasInProgressPriceListDraftItems(draft: PriceListEditorDraft): boolean {
  return draft.items.some(
    (item) => hasPriceListDraftItemContent(item) && !isPriceListDraftItemComplete(item),
  );
}

export function emptyPriceListDraft(name = "New price list"): PriceListEditorDraft {
  return {
    name,
    currency: "PLN",
    items: [createEmptyPriceListItem(0)],
  };
}

export function priceListToEditorDraft(priceList: SerializedPriceList): PriceListEditorDraft {
  return {
    name: priceList.name,
    currency: priceList.currency,
    items:
      priceList.items.length > 0
        ? priceList.items.map((item, index) => ({
            id: item.id,
            name: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate ?? "",
            note: item.note ?? "",
            sortOrder: item.sortOrder ?? index,
          }))
        : [createEmptyPriceListItem(0)],
  };
}

/** Keeps local placeholder rows after autosave — server stores only complete items. */
export function mergePriceListDraftAfterSave(
  saved: PriceListEditorDraft,
  local: PriceListEditorDraft,
): PriceListEditorDraft {
  const emptyLocalRows = local.items.filter((item) => !hasPriceListDraftItemContent(item));

  if (emptyLocalRows.length === 0) {
    return saved;
  }

  const availableSlots = PRICE_LIST_MAX_ITEMS - saved.items.length;
  if (availableSlots <= 0) {
    return saved;
  }

  return {
    ...saved,
    items: [
      ...saved.items,
      ...emptyLocalRows.slice(0, availableSlots).map((item, index) => ({
        ...item,
        sortOrder: saved.items.length + index,
      })),
    ],
  };
}

export function buildPriceListPayload(draft: PriceListEditorDraft) {
  return {
    name: draft.name.trim(),
    currency: draft.currency.trim().toUpperCase() || "PLN",
    items: draft.items
      .map((item, index) => ({
        name: item.name.trim(),
        unit: item.unit.trim(),
        unitPrice: normalizePriceListDecimalInput(item.unitPrice),
        vatRate: (() => {
          const normalized = normalizePriceListDecimalInput(item.vatRate);
          return normalized || null;
        })(),
        note: item.note.trim() || null,
        sortOrder: index,
      }))
      .filter(
        (item) =>
          item.name &&
          item.unit &&
          isPriceListDecimalValue(item.unitPrice, true) &&
          isPriceListDecimalValue(item.vatRate ?? "", false),
      ),
  };
}

export function isPriceListDraftSavable(draft: PriceListEditorDraft): boolean {
  if (hasInProgressPriceListDraftItems(draft)) {
    return false;
  }

  const payload = buildPriceListPayload(draft);
  const hasValidDraftItems = draft.items.every(
    (item) =>
      isPriceListDecimalValue(item.unitPrice, false) &&
      isPriceListDecimalValue(item.vatRate, false),
  );

  return (
    Boolean(draft.name.trim()) &&
    draft.currency.trim().length === PRICE_LIST_CURRENCY_LENGTH &&
    payload.items.length > 0 &&
    draft.items.length <= PRICE_LIST_MAX_ITEMS &&
    hasValidDraftItems
  );
}

export function countDraftPriceListItems(draft: PriceListEditorDraft): number {
  return buildPriceListPayload(draft).items.length;
}
