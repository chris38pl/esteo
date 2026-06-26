import assert from "node:assert/strict";

import { formatEstimateTemplateBlock } from "@/features/workspaces/lib/prompt-context";
import { estimateTemplateInputSchema } from "@/features/estimate-templates/schemas/estimate-template";

const templateBlock = formatEstimateTemplateBlock(
  {
    name: "Remont łazienki",
    currency: "PLN",
    generationMode: "SMART",
    sections: [
      {
        title: "Hydraulika",
        guidance: "Preferuj montaż armatury, jeśli pasuje do zakresu.",
        items: [
          { name: "Montaż WC", unit: "szt", unitPrice: "450" },
          {
            name: "Montaż umywalki",
            unit: "szt",
            unitPrice: "280",
            guidance: "Tylko jeśli klient chce umywalkę.",
          },
        ],
      },
    ],
  },
  "pl",
);

assert.match(templateBlock, /bazę usług i cen referencyjnych/);
assert.match(templateBlock, /Wybierz tylko pozycje pasujące do zakresu prac/);
assert.match(templateBlock, /Montaż WC/);
assert.match(templateBlock, /unitPrice: 450 PLN/);

const conservativeBlock = formatEstimateTemplateBlock(
  {
    name: "Standard",
    currency: "PLN",
    generationMode: "CONSERVATIVE",
    sections: [
      {
        title: "Hydraulika",
        items: [{ name: "Montaż WC", unit: "szt", unitPrice: "450" }],
      },
    ],
  },
  "pl",
);

assert.match(conservativeBlock, /standardową wycenę/);
assert.match(conservativeBlock, /Zachowaj większość pozycji z cenami/);

const templateParse = estimateTemplateInputSchema.safeParse({
  name: "Test",
  sections: [
    {
      title: "Sekcja",
      items: [{ name: "Pozycja", unit: "m²" }],
    },
  ],
});
assert.equal(templateParse.success, false);

console.log("Configuration formatter verification passed.");
