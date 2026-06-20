import {
  hasCatalogStripeRecurringMismatch,
  parseInvoicePreviewLines,
  resolveInvoiceAdjustmentKind,
  resolveInvoiceDeltaCents,
  resolveInvoicePreview,
  resolveProrationKind,
} from "../src/features/billing/lib/parse-invoice-preview-lines";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`  ✗ ${message}`);
  }
}

const recurringLine = {
  amount: 41500,
  proration: false,
  subscription: "sub_1",
  type: "subscription",
} as const;

const prorationChargeLine = {
  amount: 30400,
  proration: true,
  subscription: "sub_1",
  type: "invoiceitem",
} as const;

const prorationCreditLine = {
  amount: -5000,
  proration: true,
  subscription: "sub_1",
  type: "invoiceitem",
} as const;

const parentProrationLine = {
  amount: 19895,
  parent: {
    type: "invoice_item_details",
    invoice_item_details: {
      proration: true,
      subscription: "sub_1",
    },
  },
} as const;

const mixed = parseInvoicePreviewLines(
  [recurringLine, prorationChargeLine] as never[],
  71900,
);
assert(mixed.recurringCents === 41500, "recurring cents from subscription line");
assert(mixed.prorationCents === 30400, "positive proration sum");
assert(mixed.amountCents === 71900, "amount due preserved");
assert(resolveProrationKind(mixed.prorationCents) === "charge", "charge kind");

const parentParsed = parseInvoicePreviewLines(
  [recurringLine, parentProrationLine] as never[],
  61395,
);
assert(parentParsed.prorationCents === 19895, "parent invoice_item_details proration");

const credit = parseInvoicePreviewLines([prorationCreditLine] as never[], -5000);
assert(credit.prorationCents === -5000, "negative proration");
assert(resolveProrationKind(credit.prorationCents) === "credit", "credit kind");

const none = parseInvoicePreviewLines([], 0);
assert(resolveProrationKind(none.prorationCents) === "none", "none kind");

const catalogRecurring = 46599;
const resolvedFromProration = resolveInvoicePreview(mixed, catalogRecurring);
assert(resolvedFromProration.invoiceDeltaCents === 30400, "delta prefers parsed proration");

const missingProration = parseInvoicePreviewLines([recurringLine] as never[], 71900);
const resolvedDerived = resolveInvoicePreview(missingProration, catalogRecurring);
assert(
  resolvedDerived.invoiceDeltaCents === 71900 - catalogRecurring,
  "delta derived from amount - catalog when proration missing",
);

assert(
  resolveInvoiceDeltaCents({
    amountCents: 71900,
    catalogRecurringCents: catalogRecurring,
    parsedProrationCents: 0,
  }) === 25301,
  "explicit delta 719 - 465.99",
);

assert(
  hasCatalogStripeRecurringMismatch(41500, 46599) === true,
  "catalog vs stripe mismatch detected",
);
assert(
  hasCatalogStripeRecurringMismatch(41500, 41600) === false,
  "small catalog vs stripe diff ignored",
);

const referralRecurringLine = {
  amount: 7999,
  proration: false,
  subscription: "sub_1",
  type: "subscription",
} as const;
const referralCatalog = 9999;
const referralPreview = parseInvoicePreviewLines([referralRecurringLine] as never[], 7999);
const resolvedReferral = resolveInvoicePreview(referralPreview, referralCatalog);
assert(resolvedReferral.adjustmentKind === "subscription_discount", "referral coupon is subscription_discount");
assert(resolvedReferral.invoiceDeltaCents === -2000, "referral delta is -20 PLN");
assert(resolvedFromProration.adjustmentKind === "proration", "proration lines stay proration kind");

if (failures > 0) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}

console.log("Invoice preview parser checks passed.");
