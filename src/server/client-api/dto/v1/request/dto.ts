import { z } from "zod";

export const estimateRequestStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const requestCardSchema = z.object({
  id: z.string(),
  requestNumber: z.string().nullable(),
  status: estimateRequestStatusSchema,
  customerFullName: z.string().nullable(),
  customerEmail: z.string().nullable(),
  city: z.string().nullable(),
  propertyType: z.string().nullable(),
  attachmentCount: z.number(),
  estimateId: z.string().nullable(),
  estimateTitle: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const requestDetailSchema = z.object({
  id: z.string(),
  requestNumber: z.string().nullable(),
  status: estimateRequestStatusSchema,
  projectDescription: z.string(),
  attachmentCount: z.number(),
  customer: z
    .object({
      fullName: z.string().nullish(),
      email: z.string().nullish(),
      phone: z.string().nullish(),
    })
    .nullable(),
  address: z
    .object({
      streetAddress: z.string().nullish(),
      city: z.string().nullish(),
      postalCode: z.string().nullish(),
      voivodeship: z.string().nullish(),
    })
    .nullable(),
  estimate: z.object({ id: z.string(), title: z.string().nullable() }).nullable(),
  industryFields: z.array(
    z.object({ key: z.string(), label: z.string(), value: z.string() }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RequestCard = z.infer<typeof requestCardSchema>;
export type RequestDetail = z.infer<typeof requestDetailSchema>;
