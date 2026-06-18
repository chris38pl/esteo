-- CreateEnum
CREATE TYPE "SubscriptionChangeType" AS ENUM ('PLAN_DOWNGRADE');

-- CreateTable
CREATE TABLE "SubscriptionChange" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" "SubscriptionChangeType" NOT NULL,
    "targetPlan" "SubscriptionPlan",
    "targetPlanVersion" TEXT,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt" TIMESTAMP(3),

    CONSTRAINT "SubscriptionChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionChange_subscriptionId_canceledAt_idx" ON "SubscriptionChange"("subscriptionId", "canceledAt");

-- CreateIndex
CREATE INDEX "SubscriptionChange_subscriptionId_effectiveAt_idx" ON "SubscriptionChange"("subscriptionId", "effectiveAt");

-- AddForeignKey
ALTER TABLE "SubscriptionChange" ADD CONSTRAINT "SubscriptionChange_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
