import "server-only";

import { schedules } from "@trigger.dev/sdk";

import { prisma } from "@/db/client";
import { processReferralRewardFailedOpsCase } from "@/features/ops-cases/server/emit-referral-reward-failed-ops-case";
import { listFailedReferralsWithoutActiveOpsCase } from "@/features/ops-cases/server/repository";

export const opsReferralReconciliationTask = schedules.task({
  id: "ops-referral-reconciliation",
  cron: "0 */6 * * *",
  run: async () => {
    const referrals = await listFailedReferralsWithoutActiveOpsCase();

    let created = 0;
    let bumped = 0;
    let failed = 0;

    for (const referral of referrals) {
      const ledger = await prisma.referralCreditLedger.findFirst({
        where: {
          referralId: referral.id,
          stripeBalanceTxnId: null,
        },
        orderBy: { createdAt: "desc" },
        select: { invoiceId: true, amountCents: true },
      });

      try {
        const result = await processReferralRewardFailedOpsCase({
          referralId: referral.id,
          source: "RECONCILIATION_CRON",
          failureReason:
            referral.rewardFailureReason ?? "Referral reward failed (reconciliation backstop)",
          invoiceId: ledger?.invoiceId ?? null,
          amountCents: ledger?.amountCents ?? referral.rewardCents,
        });

        if (result.action === "created") {
          created += 1;
        } else {
          bumped += 1;
        }
      } catch (error) {
        failed += 1;
        console.error("[ops-referral-reconciliation]", referral.id, error);
      }
    }

    return {
      scanned: referrals.length,
      created,
      bumped,
      failed,
    };
  },
});
