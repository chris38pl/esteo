import Stripe from "stripe";

import {
  ADDON_UNIT_PRICES_PLN,
  type PurchasableAddonKey,
} from "../src/server/billing/addon-catalog";
import { DEFAULT_PLAN_VERSION } from "../src/server/billing/plan-catalog";
import {
  PLAN_PRICES_PLN,
  addonUnitPriceCents,
  resolvePlanPrice,
} from "../src/server/billing/plan-pricing";

type PriceCheck = {
  key: string;
  envVar: string;
  catalogCents: number;
  expectedCurrency: "pln";
};

type Mismatch = {
  key: string;
  reason: string;
  catalogCents?: number;
  stripeCents?: number | null;
  stripeCurrency?: string | null;
};

const strict = process.env.CI_PRODUCTION === "true";

const CHECKS: PriceCheck[] = [
  {
    key: "PRO",
    envVar: "STRIPE_PRICE_PRO",
    catalogCents: resolvePlanPrice(DEFAULT_PLAN_VERSION.PRO),
    expectedCurrency: "pln",
  },
  {
    key: "BUSINESS",
    envVar: "STRIPE_PRICE_BUSINESS",
    catalogCents: resolvePlanPrice(DEFAULT_PLAN_VERSION.BUSINESS),
    expectedCurrency: "pln",
  },
  {
    key: "STORAGE_PACK",
    envVar: "STRIPE_PRICE_ADDON_STORAGE",
    catalogCents: addonUnitPriceCents("STORAGE"),
    expectedCurrency: "pln",
  },
  {
    key: "SEAT_PACK",
    envVar: "STRIPE_PRICE_ADDON_SEATS",
    catalogCents: addonUnitPriceCents("SEATS"),
    expectedCurrency: "pln",
  },
];

function catalogSummary(): void {
  console.log("App catalog (PLN grosze):");
  for (const [version, cents] of Object.entries(PLAN_PRICES_PLN)) {
    console.log(`  ${version}: ${cents}`);
  }
  for (const key of ["STORAGE", "SEATS"] as PurchasableAddonKey[]) {
    console.log(`  ${key}_PACK: ${addonUnitPriceCents(key)} (${ADDON_UNIT_PRICES_PLN[key]} PLN display)`);
  }
}

async function main(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn("WARNING: STRIPE_SECRET_KEY is not set — skipping Stripe price verification.");
    catalogSummary();
    process.exit(0);
  }

  const stripe = new Stripe(secretKey);
  const mismatches: Mismatch[] = [];

  for (const check of CHECKS) {
    const priceId = process.env[check.envVar];
    if (!priceId) {
      mismatches.push({
        key: check.key,
        reason: `missing env ${check.envVar}`,
      });
      continue;
    }

    const price = await stripe.prices.retrieve(priceId);
    const stripeCents = price.unit_amount;
    const stripeCurrency = price.currency?.toLowerCase() ?? null;

    if (stripeCurrency !== check.expectedCurrency) {
      mismatches.push({
        key: check.key,
        reason: "currency mismatch",
        catalogCents: check.catalogCents,
        stripeCents,
        stripeCurrency,
      });
    }

    if (stripeCents !== check.catalogCents) {
      mismatches.push({
        key: check.key,
        reason: "unit_amount mismatch",
        catalogCents: check.catalogCents,
        stripeCents,
        stripeCurrency,
      });
    }
  }

  if (mismatches.length === 0) {
    console.log("Stripe prices match app catalog.");
    process.exit(0);
  }

  console.warn(strict ? "ERROR: Stripe price mismatch" : "WARNING: Stripe price mismatch");
  for (const row of mismatches) {
    if (row.reason === "currency mismatch") {
      console.warn(
        `  ${row.key}: expected currency=pln stripe=${row.stripeCurrency ?? "null"}`,
      );
      continue;
    }
    if (row.reason === "unit_amount mismatch") {
      console.warn(
        `  ${row.key}: catalog=${row.catalogCents} stripe=${row.stripeCents ?? "null"}`,
      );
      continue;
    }
    console.warn(`  ${row.key}: ${row.reason}`);
  }

  if (!strict) {
    console.warn("(build continues — set CI_PRODUCTION=true in prod CI to enforce)");
  }

  process.exit(strict ? 1 : 0);
}

void main();
