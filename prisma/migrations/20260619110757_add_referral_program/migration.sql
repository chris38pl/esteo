-- CreateEnum
CREATE TYPE "ReferralAttributionSource" AS ENUM ('LINK', 'EMAIL', 'CODE');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING_CLAIM', 'ACTIVE', 'INACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReferralRewardType" AS ENUM ('ACTIVATION_BONUS');

-- CreateEnum
CREATE TYPE "ReferralFraudFlag" AS ENUM ('NONE', 'SUSPICIOUS');

-- CreateTable
CREATE TABLE "UserReferralProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReferralProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredWorkspaceId" TEXT NOT NULL,
    "referredOwnerId" TEXT NOT NULL,
    "referrerContextWorkspaceId" TEXT,
    "attributionSource" "ReferralAttributionSource" NOT NULL,
    "codeUsed" TEXT,
    "referrerEmailUsed" TEXT,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING_CLAIM',
    "referredPlan" "SubscriptionPlan",
    "referredPlanVersion" TEXT,
    "expectedRewardCents" INTEGER,
    "rewardCents" INTEGER NOT NULL DEFAULT 0,
    "rewardType" "ReferralRewardType",
    "rewardGrantedAt" TIMESTAMP(3),
    "monthlyRevenueCents" INTEGER NOT NULL DEFAULT 0,
    "referrerTierAtActivation" TEXT,
    "referrerWorkspaceCountAtActivation" INTEGER,
    "fraudFlag" "ReferralFraudFlag" NOT NULL DEFAULT 'NONE',
    "fraudReason" TEXT,
    "claimIpAddress" TEXT,
    "referrerEmailDomain" TEXT,
    "referredEmailDomain" TEXT,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCreditLedger" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "rewardType" "ReferralRewardType" NOT NULL DEFAULT 'ACTIVATION_BONUS',
    "stripeBalanceTxnId" TEXT,
    "reason" TEXT NOT NULL,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReferralProfile_userId_key" ON "UserReferralProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReferralProfile_code_key" ON "UserReferralProfile"("code");

-- CreateIndex
CREATE INDEX "UserReferralProfile_code_idx" ON "UserReferralProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredWorkspaceId_key" ON "Referral"("referredWorkspaceId");

-- CreateIndex
CREATE INDEX "Referral_referrerUserId_status_idx" ON "Referral"("referrerUserId", "status");

-- CreateIndex
CREATE INDEX "Referral_referrerUserId_attributionSource_idx" ON "Referral"("referrerUserId", "attributionSource");

-- CreateIndex
CREATE INDEX "Referral_referredOwnerId_idx" ON "Referral"("referredOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCreditLedger_stripeBalanceTxnId_key" ON "ReferralCreditLedger"("stripeBalanceTxnId");

-- CreateIndex
CREATE INDEX "ReferralCreditLedger_referrerUserId_idx" ON "ReferralCreditLedger"("referrerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCreditLedger_referralId_invoiceId_key" ON "ReferralCreditLedger"("referralId", "invoiceId");

-- AddForeignKey
ALTER TABLE "UserReferralProfile" ADD CONSTRAINT "UserReferralProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredWorkspaceId_fkey" FOREIGN KEY ("referredWorkspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCreditLedger" ADD CONSTRAINT "ReferralCreditLedger_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCreditLedger" ADD CONSTRAINT "ReferralCreditLedger_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
