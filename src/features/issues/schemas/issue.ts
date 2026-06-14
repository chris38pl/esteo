import { z } from "zod";

import { issueContextSchema } from "@/features/issues/lib/issue-context";

const optionalText = z
  .string()
  .trim()
  .max(10_000)
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

export const createIssueSchema = z.object({
  type: z.enum(["BUG", "UX", "FEATURE", "AI_EXTRACTION", "PERFORMANCE"]),
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().min(1, "Description is required.").max(20_000),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional()
    .default("MEDIUM"),
  reproductionSteps: optionalText,
  expectedBehavior: optionalText,
  actualBehavior: optionalText,
  pageUrl: z.string().trim().min(1).max(2_000),
  context: issueContextSchema.nullable().optional(),
  locale: z.enum(["pl", "en"]),
  userAgent: z.string().trim().min(1).max(1_000),
  deviceType: z.enum(["MOBILE", "TABLET", "DESKTOP"]),
  viewportWidth: z.number().int().min(0).max(20_000),
  viewportHeight: z.number().int().min(0).max(20_000),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const updateIssueStatusSchema = z.object({
  number: z.number().int().positive(),
  status: z.enum(["OPEN", "RESOLVED"]),
});
