import { z } from "zod";

export const issueContextSchema = z
  .object({
    workspaceSlug: z.string().min(1).optional(),
    estimateId: z.string().min(1).optional(),
    estimateVersionId: z.string().min(1).optional(),
    requestId: z.string().min(1).optional(),
  })
  .strict();

export type IssueContext = z.infer<typeof issueContextSchema>;

export function parseIssueContext(value: unknown): IssueContext | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = issueContextSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function serializeIssueContext(context: IssueContext | null): IssueContext | null {
  if (!context) {
    return null;
  }

  const cleaned = Object.fromEntries(
    Object.entries(context).filter(([, v]) => v !== undefined && v !== ""),
  );

  return Object.keys(cleaned).length > 0 ? (cleaned as IssueContext) : null;
}
