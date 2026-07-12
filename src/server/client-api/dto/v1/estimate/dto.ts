import { z } from "zod";

export const estimateVersionStatusSchema = z.enum([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
]);

export const estimateCardSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  status: estimateVersionStatusSchema.nullable(),
  currency: z.string(),
  totalNet: z.number().nullable(),
  totalGross: z.number().nullable(),
  versionCount: z.number(),
  attachmentCount: z.number(),
  customerName: z.string().nullable(),
  city: z.string().nullable(),
  requestNumber: z.string().nullable(),
  updatedAt: z.string(),
});

const lineItemSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  name: z.string(),
  unit: z.string().nullable(),
  quantity: z.number(),
  unitPrice: z.number(),
  vatRate: z.number(),
  sortOrder: z.number(),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  sortOrder: z.number(),
  lineItems: z.array(lineItemSchema),
});

export const estimateVersionTreeSchema = z.object({
  id: z.string(),
  versionNumber: z.number(),
  status: estimateVersionStatusSchema,
  marginPercent: z.number(),
  sections: z.array(sectionSchema),
});

/**
 * First-render detail only. Full payment/history/version/audit archives are
 * intentionally excluded and served by dedicated paginated endpoints so this
 * payload stays small.
 */
export const estimateDetailSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  currency: z.string(),
  status: estimateVersionStatusSchema.nullable(),
  version: estimateVersionTreeSchema.nullable(),
  summary: z.object({
    versionCount: z.number(),
    attachmentCount: z.number(),
    totalNet: z.number().nullable(),
    totalGross: z.number().nullable(),
  }),
});

export type EstimateCard = z.infer<typeof estimateCardSchema>;
export type EstimateVersionTree = z.infer<typeof estimateVersionTreeSchema>;
export type EstimateDetail = z.infer<typeof estimateDetailSchema>;
