import { z } from "zod/v3";
import type { EstimateAiMessageRole } from "@prisma/client";

import { estimateAgentPatchSchema } from "@/ai/schemas/estimate-agent-patch";
import type { ProposeEditResult } from "@/features/estimates/lib/estimate-agent-types";
import type { AiMessageRow } from "@/features/estimates/server/ai-messages-repository";

const financialTargetSchema = z
  .object({
    kind: z.enum(["gross", "net"]),
    targetValue: z.number(),
    currentValue: z.number(),
    difference: z.number(),
    changePercent: z.number(),
  })
  .nullable();

const proposeEditResultSchema = z.object({
  patch: estimateAgentPatchSchema,
  guidance: z.object({
    intent: z.enum([
      "budget_target",
      "budget_adjustment",
      "profitability",
      "scope",
      "realism",
      "general",
    ]),
    financialTarget: financialTargetSchema,
    recommendedStrategy: z.enum([
      "scope_first",
      "margin_first",
      "cost_driver_adjustment",
      "quantity_correction",
      "mixed",
    ]),
    constraints: z.object({
      maxSingleLinePriceIncreasePercent: z.number(),
      preferAdditionsWhenTargetGapExceedsPercent: z.number(),
      maxLinesToModifyForBudgetAdjustment: z.number(),
      blockPriceOnlyWhenGapExceedsPercent: z.number(),
    }),
  }),
  simulatedImpact: z.object({
    before: z.object({ net: z.number(), gross: z.number() }),
    after: z.object({ net: z.number(), gross: z.number() }),
    difference: z.object({ net: z.number(), gross: z.number() }),
  }),
  warnings: z.array(
    z.object({
      code: z.enum([
        "unit_price_change_exceeds_limit",
        "target_gross_missed",
        "large_value_deleted",
        "budget_price_only_large_gap",
        "too_many_price_updates",
      ]),
      message: z.string(),
      itemId: z.string().optional(),
    }),
  ),
});

export type AiMessageClient = {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposal: ProposeEditResult | null;
};

function roleToClient(role: EstimateAiMessageRole): "user" | "assistant" {
  return role === "USER" ? "user" : "assistant";
}

function parseProposalJson(value: unknown): ProposeEditResult | null {
  const parsed = proposeEditResultSchema.safeParse(value);
  return parsed.success ? (parsed.data as ProposeEditResult) : null;
}

export function serializeAiMessages(rows: AiMessageRow[]): AiMessageClient[] {
  return rows.map((row) => ({
    id: row.id,
    role: roleToClient(row.role),
    content: row.content,
    proposal: row.proposalJson != null ? parseProposalJson(row.proposalJson) : null,
  }));
}

export function deriveInitialPendingEdit(
  rows: AiMessageRow[],
  latestAiApprovedRevisionAt: Date | null,
): ProposeEditResult | null {
  const last = rows[rows.length - 1];
  if (!last || last.role !== "ASSISTANT" || last.proposalJson == null) {
    return null;
  }

  if (
    latestAiApprovedRevisionAt != null &&
    latestAiApprovedRevisionAt >= last.createdAt
  ) {
    return null;
  }

  return parseProposalJson(last.proposalJson);
}
