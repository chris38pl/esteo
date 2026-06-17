-- CreateEnum
CREATE TYPE "AddonKey" AS ENUM ('STORAGE', 'SEATS', 'CLIENT_PORTAL', 'API_ACCESS', 'WHITE_LABEL', 'AI_PACK');

-- CreateEnum
CREATE TYPE "AddonStatus" AS ENUM ('ACTIVE', 'SCHEDULED_REMOVAL', 'CANCELED');

-- CreateTable
CREATE TABLE "WorkspaceAddon" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "addonKey" "AddonKey" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" "AddonStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionItemId" TEXT,
    "stripePriceId" TEXT,
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceAddon_stripeSubscriptionItemId_key" ON "WorkspaceAddon"("stripeSubscriptionItemId");

-- CreateIndex
CREATE INDEX "WorkspaceAddon_workspaceId_status_idx" ON "WorkspaceAddon"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceAddon_workspaceId_addonKey_key" ON "WorkspaceAddon"("workspaceId", "addonKey");

-- AddForeignKey
ALTER TABLE "WorkspaceAddon" ADD CONSTRAINT "WorkspaceAddon_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
