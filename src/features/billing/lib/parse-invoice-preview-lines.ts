import type Stripe from "stripe";

export type ParsedInvoicePreview = {
  recurringCents: number;
  prorationCents: number;
  amountCents: number;
};

export type ResolvedInvoicePreview = ParsedInvoicePreview & {
  invoiceDeltaCents: number;
  adjustmentKind: InvoiceAdjustmentKind;
};

export type ProrationKind = "charge" | "credit" | "none";

export type InvoiceAdjustmentKind = "none" | "proration" | "subscription_discount";

/** Minimum |stripeRecurring - catalogRecurring| to flag config mismatch (1 PLN). */
export const CATALOG_STRIPE_MISMATCH_THRESHOLD_CENTS = 100;

export function resolveProrationKind(prorationCents: number): ProrationKind {
  if (prorationCents > 0) {
    return "charge";
  }
  if (prorationCents < 0) {
    return "credit";
  }
  return "none";
}

type InvoicePreviewLine = {
  amount?: number | null;
  parent?: {
    type?: string;
    invoice_item_details?: {
      proration?: boolean;
      subscription?: string | null;
    } | null;
    subscription_item_details?: {
      subscription?: string | null;
      proration?: boolean;
    } | null;
  } | null;
  proration?: boolean;
  subscription?: string | null;
  type?: string;
};

function lineIsProration(line: InvoicePreviewLine): boolean {
  if (line.proration) {
    return true;
  }

  if (line.parent?.invoice_item_details?.proration) {
    return true;
  }

  if (line.parent?.subscription_item_details?.proration) {
    return true;
  }

  if (
    line.parent?.type === "invoice_item_details" &&
    line.parent.invoice_item_details?.proration
  ) {
    return true;
  }

  if (line.type === "invoiceitem" && line.proration) {
    return true;
  }

  return false;
}

function lineIsRecurringSubscription(line: InvoicePreviewLine): boolean {
  if (lineIsProration(line)) {
    return false;
  }

  if (line.parent?.subscription_item_details) {
    return true;
  }

  if (line.parent?.invoice_item_details?.subscription) {
    return true;
  }

  return line.subscription != null || line.type === "subscription";
}

/**
 * Neutral signed delta for invoice breakdown UI.
 * Prefers parsed proration; falls back to amountDue - catalog when parser missed lines.
 */
export function resolveInvoiceDeltaCents(params: {
  amountCents: number;
  catalogRecurringCents: number;
  parsedProrationCents: number;
}): number {
  if (params.parsedProrationCents !== 0) {
    return params.parsedProrationCents;
  }

  const derived = params.amountCents - params.catalogRecurringCents;
  if (Math.abs(derived) > 1) {
    return derived;
  }

  return 0;
}

export function resolveInvoiceAdjustmentKind(params: {
  parsedProrationCents: number;
  amountCents: number;
  catalogRecurringCents: number;
  stripeRecurringCents: number;
}): InvoiceAdjustmentKind {
  if (params.parsedProrationCents !== 0) {
    return "proration";
  }

  const derived = params.amountCents - params.catalogRecurringCents;
  if (Math.abs(derived) <= 1) {
    return "none";
  }

  if (
    params.stripeRecurringCents > 0 &&
    params.catalogRecurringCents > 0 &&
    params.stripeRecurringCents < params.catalogRecurringCents
  ) {
    return "subscription_discount";
  }

  return "none";
}

export function parseCustomerBalanceAppliedCents(invoice: {
  starting_balance?: number | null;
  ending_balance?: number | null;
}): number {
  const starting = invoice.starting_balance ?? 0;
  const ending = invoice.ending_balance ?? 0;

  if (starting >= 0) {
    return 0;
  }

  const applied = ending - starting;
  return applied > 0 ? applied : 0;
}

export function hasCatalogStripeRecurringMismatch(
  stripeRecurringCents: number,
  catalogRecurringCents: number,
  thresholdCents: number = CATALOG_STRIPE_MISMATCH_THRESHOLD_CENTS,
): boolean {
  if (stripeRecurringCents <= 0 || catalogRecurringCents <= 0) {
    return false;
  }

  return Math.abs(stripeRecurringCents - catalogRecurringCents) > thresholdCents;
}

/**
 * Splits Stripe invoice preview lines into recurring (next period subscription)
 * and signed net proration (credits included).
 */
export function parseInvoicePreviewLines(
  lines: Stripe.InvoiceLineItem[],
  amountDue: number,
): ParsedInvoicePreview {
  let prorationCents = 0;
  let recurringCents = 0;

  for (const rawLine of lines) {
    const line = rawLine as InvoicePreviewLine;
    const amount = line.amount ?? 0;

    if (lineIsProration(line)) {
      prorationCents += amount;
      continue;
    }

    if (lineIsRecurringSubscription(line)) {
      recurringCents += amount;
    }
  }

  return {
    recurringCents,
    prorationCents,
    amountCents: amountDue,
  };
}

export function resolveInvoicePreview(
  parsed: ParsedInvoicePreview,
  catalogRecurringCents: number,
): ResolvedInvoicePreview {
  const invoiceDeltaCents = resolveInvoiceDeltaCents({
    amountCents: parsed.amountCents,
    catalogRecurringCents,
    parsedProrationCents: parsed.prorationCents,
  });

  return {
    ...parsed,
    invoiceDeltaCents,
    adjustmentKind: resolveInvoiceAdjustmentKind({
      parsedProrationCents: parsed.prorationCents,
      amountCents: parsed.amountCents,
      catalogRecurringCents,
      stripeRecurringCents: parsed.recurringCents,
    }),
  };
}
