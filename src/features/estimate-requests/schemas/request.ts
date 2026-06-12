import { z } from "zod";

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function textField(min: number, max: number) {
  return z
    .string()
    .transform(cleanText)
    .refine((value) => value.length >= min, `Must be at least ${min} characters.`)
    .refine((value) => value.length <= max, `Must be at most ${max} characters.`)
    .refine((value) => !CONTROL_CHARACTERS.test(value), "Invalid characters.");
}

function optionalTextField(max: number) {
  return z
    .string()
    .transform(cleanText)
    .refine((value) => value.length <= max, `Must be at most ${max} characters.`)
    .refine((value) => !CONTROL_CHARACTERS.test(value), "Invalid characters.")
    .optional()
    .or(z.literal(""));
}

export const publicEstimateRequestSchema = z.object({
  workspaceSlug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  customer: z.object({
    fullName: textField(2, 120),
    email: z.string().trim().toLowerCase().email().max(160),
    phone: textField(6, 40),
  }),
  address: z.object({
    streetAddress: textField(3, 200),
    city: textField(2, 120),
    postalCode: textField(2, 20),
    voivodeship: textField(2, 80),
  }),
  project: z.object({
    preferredStartDate: textField(2, 40),
    description: z
      .string()
      .trim()
      .min(20)
      .max(4000)
      .refine((value) => !CONTROL_CHARACTERS.test(value), "Invalid characters."),
  }),
  industryFields: z.record(
    z.string().trim().min(1).max(64).regex(/^[a-z][a-z0-9_]*$/),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
  security: z
    .object({
      companyWebsite: optionalTextField(200),
      captchaToken: optionalTextField(2000),
    })
    .optional(),
  voiceIntake: z.record(z.string(), z.unknown()).optional(),
});

export type PublicEstimateRequestInput = z.infer<typeof publicEstimateRequestSchema>;

const optionalTitleField = z
  .string()
  .transform(cleanText)
  .refine((value) => value.length <= 200, "Must be at most 200 characters.")
  .refine((value) => !CONTROL_CHARACTERS.test(value), "Invalid characters.")
  .optional()
  .or(z.literal(""));

/** Dashboard “New estimate” — same body as public form plus optional title. */
export const internalEstimateCreateSchema = publicEstimateRequestSchema
  .omit({ workspaceSlug: true, security: true })
  .extend({
    title: optionalTitleField,
  });

export type InternalEstimateCreateInput = z.infer<typeof internalEstimateCreateSchema>;
