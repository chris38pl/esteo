import { z } from "zod";

import { accountProfileSchema } from "@/server/client-api/dto/v1/account/dto";
import {
  subscriptionPlanSchema,
  workspaceOverviewSchema,
  workspaceRefSchema,
  workspaceRoleSchema,
} from "@/server/client-api/dto/v1/workspace/dto";

const entitlementsLightSchema = z.object({
  plan: subscriptionPlanSchema,
  usage: z.object({
    estimatesThisMonth: z.number(),
    aiCallsThisMonth: z.number(),
  }),
  seats: z.object({
    used: z.number(),
    limit: z.number().nullable(),
  }),
  limits: z.object({
    maxEstimatesPerMonth: z.number().nullable(),
    maxStorageBytes: z.number().nullable(),
  }),
});

/**
 * Startup context only. No business data (dashboard/estimates/inbox) — those
 * have dedicated endpoints. Kept fast because it is called on every app start.
 */
export const bootstrapSchema = z.object({
  meta: z.object({
    apiVersion: z.string(),
    dtoVersion: z.string(),
    serverVersion: z.string(),
  }),
  user: accountProfileSchema,
  locale: z.string(),
  workspaces: z.array(workspaceRefSchema),
  activeWorkspace: workspaceOverviewSchema.nullable(),
  permissions: z.object({
    role: workspaceRoleSchema.nullable(),
    canCreateEstimate: z.boolean(),
    canInviteMembers: z.boolean(),
  }),
  subscription: z
    .object({ plan: subscriptionPlanSchema, status: z.string() })
    .nullable(),
  entitlements: entitlementsLightSchema.nullable(),
  featureFlags: z.record(z.string(), z.boolean()),
});

export type Bootstrap = z.infer<typeof bootstrapSchema>;
