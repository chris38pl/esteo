import "server-only";

import type { OpsCaseSource } from "@prisma/client";

import { referralRewardFailedDedupeKey } from "@/features/ops-cases/lib/ops-case-dedupe-key";
import { getOpsCaseCatalogEntry } from "@/features/ops-cases/lib/ops-case-catalog";
import { emitOpsCase, type EmitOpsCaseResult } from "@/features/ops-cases/server/emit-ops-case";
import { notifyOpsCaseOpened } from "@/features/notifications/server/notification-emit-helpers";
import { prisma } from "@/db/client";

export async function emitReferralRewardFailedOpsCase(input: {
  referralId: string;
  source: OpsCaseSource;
  failureReason: string;
  invoiceId?: string | null;
  amountCents?: number | null;
}): Promise<EmitOpsCaseResult> {
  const referral = await prisma.referral.findUnique({
    where: { id: input.referralId },
    select: {
      id: true,
      referrerUserId: true,
      referredWorkspaceId: true,
      referredOwnerId: true,
      rewardCents: true,
    },
  });

  if (!referral) {
    throw new Error(`Referral not found: ${input.referralId}`);
  }

  const catalog = getOpsCaseCatalogEntry("REFERRAL_REWARD_FAILED");

  return emitOpsCase({
    type: "REFERRAL_REWARD_FAILED",
    source: input.source,
    dedupeKey: referralRewardFailedDedupeKey(referral.id),
    fingerprint: catalog.fingerprint,
    severity: catalog.defaultSeverity,
    title: catalog.titleTemplate,
    summary: input.failureReason,
    affectedUserId: referral.referrerUserId,
    actorUserId: referral.referredOwnerId,
    workspaceId: referral.referredWorkspaceId,
    entityKind: "referral",
    entityId: referral.id,
    payload: {
      referralId: referral.id,
      invoiceId: input.invoiceId ?? null,
      amountCents: input.amountCents ?? referral.rewardCents,
      failureReason: input.failureReason,
    },
  });
}

export async function processReferralRewardFailedOpsCase(input: {
  referralId: string;
  source: OpsCaseSource;
  failureReason: string;
  invoiceId?: string | null;
  amountCents?: number | null;
  locale?: string;
}): Promise<EmitOpsCaseResult> {
  const result = await emitReferralRewardFailedOpsCase(input);

  if (result.action === "created") {
    const catalog = getOpsCaseCatalogEntry("REFERRAL_REWARD_FAILED");
    await notifyOpsCaseOpened({
      locale: input.locale ?? "pl",
      caseNumber: result.caseNumber,
      caseTitle: catalog.titleTemplate,
      caseType: catalog.type,
      severity: catalog.defaultSeverity,
    });
  }

  return result;
}
