-- CreateEnum
CREATE TYPE "WorkspaceOwnershipTransferStatus" AS ENUM ('PENDING_RECIPIENT', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "WorkspaceOwnershipTransfer" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "toUserId" TEXT,
    "token" TEXT NOT NULL,
    "status" "WorkspaceOwnershipTransferStatus" NOT NULL DEFAULT 'PENDING_RECIPIENT',
    "planSnapshot" "SubscriptionPlan" NOT NULL,
    "periodEndSnapshot" TIMESTAMP(3) NOT NULL,
    "keepSenderAsMember" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceOwnershipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceOwnershipTransfer_token_key" ON "WorkspaceOwnershipTransfer"("token");

-- CreateIndex
CREATE INDEX "WorkspaceOwnershipTransfer_workspaceId_status_idx" ON "WorkspaceOwnershipTransfer"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "WorkspaceOwnershipTransfer_toEmail_status_idx" ON "WorkspaceOwnershipTransfer"("toEmail", "status");

-- CreateIndex
CREATE INDEX "WorkspaceOwnershipTransfer_toUserId_status_idx" ON "WorkspaceOwnershipTransfer"("toUserId", "status");

-- Partial unique: one pending transfer per workspace
CREATE UNIQUE INDEX "WorkspaceOwnershipTransfer_one_pending_per_workspace"
ON "WorkspaceOwnershipTransfer"("workspaceId")
WHERE "status" = 'PENDING_RECIPIENT';

-- AddForeignKey
ALTER TABLE "WorkspaceOwnershipTransfer" ADD CONSTRAINT "WorkspaceOwnershipTransfer_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceOwnershipTransfer" ADD CONSTRAINT "WorkspaceOwnershipTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceOwnershipTransfer" ADD CONSTRAINT "WorkspaceOwnershipTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
