-- CreateEnum
CREATE TYPE "WorkspaceAppearanceTheme" AS ENUM ('OCEAN_BREEZE', 'FOREST_MIST', 'SUNRISE_PEAK', 'GREEN_VALLEY');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "appearanceTheme" "WorkspaceAppearanceTheme" NOT NULL DEFAULT 'OCEAN_BREEZE';
