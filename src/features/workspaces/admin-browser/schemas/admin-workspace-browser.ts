import { z } from "zod";

export const searchAdminWorkspacesInputSchema = z.object({
  query: z.string(),
  locale: z.enum(["pl", "en"]),
  limit: z.number().int().min(1).max(20).default(8),
});
