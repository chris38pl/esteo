/*
  Warnings:

  - Changed the type of `role` on the `WorkspaceInvitation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "InviteRole" AS ENUM ('MEMBER', 'VIEWER');

-- AlterTable
ALTER TABLE "WorkspaceInvitation" DROP COLUMN "role",
ADD COLUMN     "role" "InviteRole" NOT NULL;
