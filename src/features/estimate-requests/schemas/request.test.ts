import assert from "node:assert/strict";

import { WorkspaceIndustry } from "@prisma/client";

import { createPublicEstimateRequestSchema } from "./request";

const servicesPayload = {
  workspaceSlug: "strzyzenie-psow",
  customer: {
    fullName: "Jan Kowalski",
    email: "jan@example.com",
    phone: "+48123456789",
  },
  address: {
    serviceLocation: "Sielawy 23e",
    streetAddress: "",
    city: "",
    postalCode: "",
    voivodeship: "",
  },
  project: {
    preferredStartDate: "1-3-months",
    description: "Chce ostrzyc psa. Ladny piesek.",
  },
  industryFields: {},
  security: {
    companyWebsite: "",
    captchaToken: "",
  },
};

const otherParse = createPublicEstimateRequestSchema(WorkspaceIndustry.OTHER).safeParse(
  servicesPayload,
);
assert.equal(
  otherParse.success,
  true,
  "OTHER industry should accept serviceLocation without construction address",
);
if (otherParse.success) {
  assert.equal(otherParse.data.address.serviceLocation, "Sielawy 23e");
}

const constructionParse = createPublicEstimateRequestSchema(
  WorkspaceIndustry.CONSTRUCTION,
).safeParse(servicesPayload);
assert.equal(
  constructionParse.success,
  false,
  "CONSTRUCTION industry should reject payload with empty construction address",
);

const constructionPayload = {
  ...servicesPayload,
  address: {
    streetAddress: "Sielawy 23e",
    city: "Warszawa",
    postalCode: "00-001",
    voivodeship: "mazowieckie",
  },
};

const constructionValidParse = createPublicEstimateRequestSchema(
  WorkspaceIndustry.CONSTRUCTION,
).safeParse(constructionPayload);
assert.equal(
  constructionValidParse.success,
  true,
  "CONSTRUCTION industry should accept full construction address",
);

console.log("request.test.ts: ok");
