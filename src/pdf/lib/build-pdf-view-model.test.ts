import assert from "node:assert/strict";

import { WorkspaceIndustry } from "@prisma/client";

import { buildEstimatePdfViewModel } from "./build-pdf-view-model";

const baseInput = {
  locale: "pl" as const,
  currency: "PLN",
  requestNumber: "ER-2026-00001",
  estimateId: "estimate-test-id",
  customerData: {
    fullName: "Jan Kowalski",
    email: "jan@example.com",
    phone: "+48123456789",
  },
  propertyTypeLabel: "Mieszkanie",
  floorArea: 70,
  workspace: {
    name: "Test Workspace",
    settings: {
      companyAddress: "ul. Testowa 1, Poznań",
      companyTaxId: "1234567890",
      companyEmail: "biuro@example.com",
      companyPhone: "+48111222333",
      branding: {},
    },
  },
  versionNumber: 1,
  marginPercent: 0,
  sections: [
    {
      title: "Sekcja",
      sortOrder: 0,
      lineItems: [
        {
          name: "Pozycja",
          unit: "szt.",
          quantity: 1,
          unitPrice: 100,
          vatRate: 0.23,
          sortOrder: 0,
        },
      ],
    },
  ],
  userPlan: "PRO" as const,
};

const otherModel = buildEstimatePdfViewModel({
  ...baseInput,
  workspaceIndustry: WorkspaceIndustry.OTHER,
  requestAddress: {
    serviceLocation: "Sala Magnolia, Poznań",
  },
});

assert.equal(
  otherModel.locationSectionLabel,
  "MIEJSCE REALIZACJI USŁUGI",
  "OTHER industry should use service location section label in PL",
);
assert.equal(
  otherModel.investment.addressStreet,
  "Sala Magnolia, Poznań",
  "OTHER industry should map serviceLocation to investment addressStreet",
);
assert.equal(
  otherModel.investment.propertyType,
  null,
  "OTHER industry should not show property type in investment section",
);
assert.equal(
  otherModel.investment.addressCityLine,
  null,
  "OTHER industry should not split service location into city line",
);

const constructionModel = buildEstimatePdfViewModel({
  ...baseInput,
  workspaceIndustry: WorkspaceIndustry.CONSTRUCTION,
  requestAddress: {
    streetAddress: "ul. Polna 12/4",
    city: "Poznań",
    postalCode: "60-101",
    voivodeship: "wielkopolskie",
  },
});

assert.equal(
  constructionModel.locationSectionLabel,
  "INWESTYCJA",
  "Construction industry should keep investment section label in PL",
);
assert.equal(
  constructionModel.investment.propertyType,
  "Mieszkanie",
  "Construction industry should show property type",
);
assert.equal(
  constructionModel.investment.addressStreet,
  "ul. Polna 12/4",
  "Construction industry should map street address",
);
assert.equal(
  constructionModel.investment.addressCityLine,
  "60-101 Poznań",
  "Construction industry should map postal code and city",
);

const otherEnModel = buildEstimatePdfViewModel({
  ...baseInput,
  locale: "en",
  workspaceIndustry: WorkspaceIndustry.OTHER,
  requestAddress: {
    serviceLocation: "Magnolia Hall, Poznań",
  },
});

assert.equal(
  otherEnModel.locationSectionLabel,
  "SERVICE LOCATION",
  "OTHER industry should use service location section label in EN",
);

console.log("build-pdf-view-model tests passed");
