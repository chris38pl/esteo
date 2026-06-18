import { z } from "zod";

export const searchWorkspaceInputSchema = z.object({
  workspaceId: z.string().min(1),
  query: z.string(),
  locale: z.enum(["pl", "en"]),
});

export const recordRecentDocumentInputSchema = z.object({
  workspaceId: z.string().min(1),
  entityType: z.enum(["ESTIMATE", "INQUIRY", "ATTACHMENT"]),
  entityId: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  iconType: z.enum(["ESTIMATE", "REQUEST", "FILE"]),
  locale: z.enum(["pl", "en"]),
});

export const listRecentDocumentsInputSchema = z.object({
  workspaceId: z.string().min(1),
  locale: z.enum(["pl", "en"]),
});
