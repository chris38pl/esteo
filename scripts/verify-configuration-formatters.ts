import assert from "node:assert/strict";

import {
  formatEstimateTemplateBlock,
  formatPriceListBlock,
} from "@/features/workspaces/lib/prompt-context";
import { estimateTemplateInputSchema } from "@/features/estimate-templates/schemas/estimate-template";
import { priceListInputSchema } from "@/features/price-lists/schemas/price-list";

const templateBlock = formatEstimateTemplateBlock({
  name: "Remont łazienki",
  sections: [
    {
      title: "Hydraulika",
      guidance: "Preferuj montaż armatury, jeśli pasuje do zakresu.",
      items: [
        { name: "Montaż WC", unit: "szt" },
        { name: "Montaż umywalki", unit: "szt", guidance: "Tylko jeśli klient chce umywalkę." },
      ],
    },
  ],
});

assert.match(templateBlock, /Prefer using template items whenever they fit the project scope/);
assert.match(templateBlock, /Remove items that are clearly outside the project scope/);
assert.match(templateBlock, /Add missing items when necessary/);
assert.match(templateBlock, /Montaż WC/);

const priceListBlock = formatPriceListBlock({
  name: "Standard 2026",
  currency: "PLN",
  items: [{ name: "Malowanie", unit: "m²", unitPrice: "18.00", vatRate: "0.23" }],
});

assert.match(priceListBlock, /high confidence/);
assert.match(priceListBlock, /service name and billing unit/);
assert.match(priceListBlock, /m²/);
assert.match(priceListBlock, /roboczogodzina/);
assert.match(priceListBlock, /unitPrice: 18.00/);

const templateParse = estimateTemplateInputSchema.safeParse({
  name: "Test",
  sections: Array.from({ length: 21 }, (_, index) => ({
    title: `Sekcja ${index + 1}`,
    items: [],
  })),
});
assert.equal(templateParse.success, false);

const priceListParse = priceListInputSchema.safeParse({
  name: "Test",
  currency: "PLN",
  items: Array.from({ length: 201 }, (_, index) => ({
    name: `Pozycja ${index + 1}`,
    unit: "szt",
    unitPrice: "10.00",
  })),
});
assert.equal(priceListParse.success, false);

console.log("Configuration formatter verification passed.");
