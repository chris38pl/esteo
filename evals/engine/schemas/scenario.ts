import { z } from "zod/v3";

import { estimateDraftOutputSchema } from "@/ai/schemas/estimate-draft-output";

export const scenarioCategorySchema = z.enum(["business", "edge", "stress", "generic"]);
export type ScenarioCategory = z.infer<typeof scenarioCategorySchema>;

export const localeSchema = z.enum(["pl", "en"]);
export type EvalLocale = z.infer<typeof localeSchema>;

export const termScopeSchema = z.enum(["any_item", "any_section", "section_title"]);

export const termExpectationSchema = z.object({
  term: z.string().min(1),
  scope: termScopeSchema.optional().default("any_item"),
});

export const workspaceEstimateSectionFixtureSchema = z.object({
  key: z.string().min(1),
  titlePl: z.string().min(1),
  titleEn: z.string().min(1),
  rulePl: z.string().optional(),
  ruleEn: z.string().optional(),
  active: z.boolean().default(true),
});

export const workspaceRuleFixtureSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const templateItemFixtureSchema = z.object({
  name: z.string().min(1),
  unit: z.string().optional(),
  unitPrice: z.string().optional(),
  vatRate: z.string().optional(),
  note: z.string().optional(),
  guidance: z.string().optional(),
});

export const templateSectionFixtureSchema = z.object({
  title: z.string().min(1),
  guidance: z.string().optional(),
  items: z.array(templateItemFixtureSchema).default([]),
});

export const templateFixtureSchema = z.object({
  id: z.string().default("eval-template"),
  name: z.string().min(1),
  generationMode: z.enum(["CONSERVATIVE", "SMART"]).default("SMART"),
  currency: z.string().default("PLN"),
  sections: z.array(templateSectionFixtureSchema).default([]),
});

export const priceListItemFixtureSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  unitPrice: z.string().min(1),
  vatRate: z.string().optional(),
  note: z.string().optional(),
});

export const priceListFixtureSchema = z.object({
  id: z.string().default("eval-price-list"),
  name: z.string().min(1),
  currency: z.string().default("PLN"),
  items: z.array(priceListItemFixtureSchema).default([]),
});

export const systemRulesFixtureSchema = z.object({
  rounding: z.boolean().optional(),
  units: z.boolean().optional(),
  assumptions: z.boolean().optional(),
});

export const subscriptionPlanFixtureSchema = z.enum(["FREE", "PRO", "BUSINESS"]);
export const subscriptionStatusFixtureSchema = z.enum([
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
]);

export const evalWorkspaceIndustrySchema = z.enum([
  "OTHER",
  "CONSTRUCTION",
  "CARPENTRY",
  "ELECTRICAL",
  "PLUMBING",
]);

export const workspaceFixtureSchema = z.object({
  industry: evalWorkspaceIndustrySchema.default("OTHER"),
  industryOtherText: z.string().default(""),
  companyDescription: z.string().default(""),
  aiInstructions: z.string().optional(),
  estimateSections: z.array(workspaceEstimateSectionFixtureSchema).optional(),
  template: templateFixtureSchema.nullable().optional(),
  priceList: priceListFixtureSchema.nullable().optional(),
  subscriptionPlan: subscriptionPlanFixtureSchema.default("PRO"),
  subscriptionStatus: subscriptionStatusFixtureSchema.default("ACTIVE"),
  rules: z.array(workspaceRuleFixtureSchema).default([]),
  systemRules: systemRulesFixtureSchema.optional(),
});

export const requestFixtureSchema = z.object({
  customer: z
    .object({
      fullName: z.string(),
      email: z.string(),
      phone: z.string(),
    })
    .optional(),
  project: z.object({
    description: z.string().min(1),
    preferredStartDate: z.string().optional(),
  }),
  industryFields: z
    .record(z.union([z.string(), z.array(z.string())]))
    .optional(),
  address: z
    .object({
      serviceLocation: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
});

export const voiceIntakeFixtureSchema = z.object({
  transcript: z.string().min(1),
  locale: localeSchema.default("pl"),
});

export const judgeExpectationsSchema = z.object({
  focus: z.array(z.string()).default([]),
  minScore: z.number().min(0).max(10).default(7),
  minContextAlignment: z.number().min(0).max(10).default(7),
  minReferenceSimilarity: z.number().min(0).max(10).default(7),
});

export const expectedTemplateItemSchema = z.object({
  term: z.string().min(1),
});

export const expectedPriceSchema = z.object({
  term: z.string().min(1),
  unit: z.string().min(1),
  unitPrice: z.string().min(1),
});

export const forbiddenPriceSchema = z.object({
  term: z.string().min(1),
  sourceUnit: z.string().min(1),
  unitPrice: z.string().min(1),
});

export const configurationExpectationsSchema = z.object({
  expectedTemplateItems: z.array(expectedTemplateItemSchema).default([]),
  expectedPrices: z.array(expectedPriceSchema).default([]),
  mustNotUsePrices: z.array(forbiddenPriceSchema).default([]),
});

export const configurationLifecycleExpectationsSchema = z.object({
  promptMustContain: z.array(z.string()).default([]),
  promptMustNotContain: z.array(z.string()).default([]),
  templateInPrompt: z.boolean().optional(),
  priceListInPrompt: z.boolean().optional(),
});

export const configurationSnapshotFixtureSchema = z.object({
  template: templateFixtureSchema.nullable().optional(),
  priceList: priceListFixtureSchema.nullable().optional(),
});

export const expectationsSchema = z.object({
  mustHave: z.array(termExpectationSchema).default([]),
  mustNotHave: z.array(termExpectationSchema).default([]),
  coverageTerms: z.array(z.string()).default([]),
  requiredSections: z.array(z.string()).default([]),
  forbiddenSections: z.array(z.string()).default([]),
  minimumDistinctSections: z.number().int().min(1).optional(),
  leakageDomain: z.enum(["construction", "services"]).default("construction"),
  maxLeakageTerms: z.number().int().min(0).default(0),
  minLineItems: z.number().int().min(0).default(1),
  maxLineItems: z.number().int().min(1).default(100),
  configuration: configurationExpectationsSchema.optional(),
  configurationLifecycle: configurationLifecycleExpectationsSchema.optional(),
  judge: judgeExpectationsSchema.optional(),
});

export const referenceEstimateSchema = estimateDraftOutputSchema.partial({
  suggestedMarginPercent: true,
});

export const evalScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  locale: localeSchema.default("pl"),
  category: scenarioCategorySchema.default("business"),
  quick: z.boolean().default(false),
  critical: z.boolean().default(false),
  profileVersion: z.string().optional(),
  workspace: workspaceFixtureSchema,
  request: requestFixtureSchema,
  voiceIntake: voiceIntakeFixtureSchema.nullable().optional(),
  referenceEstimate: referenceEstimateSchema.optional(),
  /** Stored snapshot (retry / assistant) — overrides live workspace template/price list in prompt. */
  configurationSnapshot: configurationSnapshotFixtureSchema.optional(),
  expectations: expectationsSchema,
});

export type EvalScenario = z.infer<typeof evalScenarioSchema>;
export type Expectations = z.infer<typeof expectationsSchema>;

const estimateSnapshotItemSchema = z.object({
  id: z.string().default("item-1"),
  name: z.string().min(1),
  unit: z.string().nullable().optional(),
  quantity: z.number().min(0).default(1),
  unitPrice: z.number().min(0),
  vatRate: z.number().min(0).max(1).default(0.23),
  sortOrder: z.number().int().min(0).default(0),
});

const estimateSnapshotSectionSchema = z.object({
  id: z.string().default("section-1"),
  title: z.string().min(1),
  sortOrder: z.number().int().min(0).default(0),
  items: z.array(estimateSnapshotItemSchema).default([]),
});

export const assistantExpectationsSchema = z.object({
  addedItemsMustMatchPrice: z.array(expectedPriceSchema).default([]),
  targetSection: z.string().optional(),
  promptMustContain: z.array(z.string()).default([]),
});

export const assistantScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  locale: localeSchema.default("pl"),
  quick: z.boolean().default(false),
  critical: z.boolean().default(false),
  workspace: workspaceFixtureSchema,
  configurationSnapshot: configurationSnapshotFixtureSchema.optional(),
  estimateSnapshot: z.object({
    marginPercent: z.number().default(0),
    sections: z.array(estimateSnapshotSectionSchema).min(1),
  }),
  userMessage: z.string().min(1),
  expectations: assistantExpectationsSchema,
});

export type AssistantScenario = z.infer<typeof assistantScenarioSchema>;
