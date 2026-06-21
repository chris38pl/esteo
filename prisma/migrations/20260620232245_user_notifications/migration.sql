-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('invitation_received', 'invitation_accepted', 'invitation_declined', 'invitation_revoked', 'invitation_on_hold', 'invitation_released', 'member_removed', 'member_suspended_seat', 'member_suspended_unpaid', 'member_reactivated', 'ownership_transfer_received', 'ownership_transfer_accepted', 'ownership_transfer_declined', 'ownership_transfer_expired', 'subscription_past_due', 'subscription_grace_period', 'subscription_expired', 'subscription_renewal_soon', 'subscription_cancel_scheduled', 'subscription_resumed', 'plan_downgrade_scheduled', 'checkout_completed', 'workspace_provisioning_incomplete', 'estimate_limit_near', 'estimate_limit_reached', 'estimate_request_submitted', 'estimate_request_queued_manual', 'estimate_request_ai_completed', 'estimate_request_ai_failed', 'referral_signup_pending', 'referral_activated', 'referral_reward_granted', 'referral_reward_failed', 'issue_status_changed');

-- CreateEnum
CREATE TYPE "NotificationState" AS ENUM ('INFO', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationPreferenceCategory" AS ENUM ('MEMBERSHIP', 'BILLING', 'ESTIMATES', 'REFERRALS', 'QA');

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "type" "NotificationType" NOT NULL,
    "state" "NotificationState" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "dedupeKey" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "primaryActionLabelKey" TEXT,
    "primaryActionHref" TEXT,
    "secondaryActionLabelKey" TEXT,
    "secondaryActionHref" TEXT,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "NotificationPreferenceCategory" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserNotification_userId_state_resolvedAt_createdAt_idx" ON "UserNotification"("userId", "state", "resolvedAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotification_userId_dedupeKey_key" ON "UserNotification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "UserNotificationPreference_userId_idx" ON "UserNotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationPreference_userId_category_key" ON "UserNotificationPreference"("userId", "category");

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationPreference" ADD CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
