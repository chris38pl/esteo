import { z } from "zod";

import { workspaceRefSchema } from "@/server/client-api/dto/v1/workspace/dto";

export const dashboardSummarySchema = z.object({
  greetingName: z.string(),
  workspace: workspaceRefSchema,
  kpis: z.object({
    estimates: z.number(),
    sent: z.number(),
    income: z.number(),
    currency: z.string(),
  }),
  overdue: z.object({
    amount: z.number(),
    count: z.number(),
    currency: z.string(),
  }),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
