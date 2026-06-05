-- CreateEnum
CREATE TYPE "AvatarSource" AS ENUM ('CLERK', 'PRESET');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarSource" "AvatarSource" NOT NULL DEFAULT 'PRESET';

-- Backfill: users with a Clerk/OAuth photo use CLERK source
UPDATE "User" SET "avatarSource" = 'CLERK' WHERE "avatarUrl" IS NOT NULL;
