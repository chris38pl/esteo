import { z } from "zod";

export const workspaceRoleSchema = z.enum(["OWNER", "MEMBER", "VIEWER"]);
export const subscriptionPlanSchema = z.enum(["FREE", "PRO", "BUSINESS"]);

export const workspaceRefSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});

export const workspaceOverviewSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  role: workspaceRoleSchema,
  plan: subscriptionPlanSchema,
  status: z.string(),
  storage: z.object({
    usedBytes: z.number(),
    limitBytes: z.number().nullable(),
  }),
  usage: z.object({
    estimatesThisMonth: z.number(),
    aiCallsThisMonth: z.number(),
  }),
  seats: z.object({
    used: z.number(),
    limit: z.number().nullable(),
  }),
});

export type WorkspaceRef = z.infer<typeof workspaceRefSchema>;
export type WorkspaceOverview = z.infer<typeof workspaceOverviewSchema>;
