-- CreateEnum
CREATE TYPE "ReferralRewardStatus" AS ENUM ('PENDING', 'GRANTED', 'FAILED');

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN "rewardStatus" "ReferralRewardStatus",
ADD COLUMN "rewardFailureReason" TEXT,
ADD COLUMN "rewardLastRetryAt" TIMESTAMP(3);

-- GRANTED: ledger has a Stripe balance transaction
UPDATE "Referral" r
SET "rewardStatus" = 'GRANTED'
WHERE EXISTS (
  SELECT 1 FROM "ReferralCreditLedger" l
  WHERE l."referralId" = r.id AND l."stripeBalanceTxnId" IS NOT NULL
);

-- PENDING: active reward without Stripe credit (includes incorrectly pre-granted rows)
UPDATE "Referral" r
SET
  "rewardStatus" = 'PENDING',
  "rewardGrantedAt" = NULL
WHERE r."rewardStatus" IS NULL
  AND r.status = 'ACTIVE'
  AND r."rewardCents" > 0
  AND NOT EXISTS (
    SELECT 1 FROM "ReferralCreditLedger" l
    WHERE l."referralId" = r.id AND l."stripeBalanceTxnId" IS NOT NULL
  );

-- Backfill rewardGrantedAt from ledger for GRANTED rows missing the timestamp
UPDATE "Referral" r
SET "rewardGrantedAt" = sub."grantedAt"
FROM (
  SELECT l."referralId", MIN(l."createdAt") AS "grantedAt"
  FROM "ReferralCreditLedger" l
  WHERE l."stripeBalanceTxnId" IS NOT NULL
  GROUP BY l."referralId"
) sub
WHERE r.id = sub."referralId"
  AND r."rewardStatus" = 'GRANTED'
  AND r."rewardGrantedAt" IS NULL;
