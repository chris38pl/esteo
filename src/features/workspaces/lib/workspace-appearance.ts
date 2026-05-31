import { WorkspaceAppearanceTheme } from "@prisma/client";

export type WorkspaceAppearanceConfig = {
  theme: WorkspaceAppearanceTheme;
  imageSrc: string;
  accent: string;
  accentMuted: string;
  dotColor: string;
};

export const WORKSPACE_APPEARANCE_THEMES: WorkspaceAppearanceTheme[] = [
  WorkspaceAppearanceTheme.OCEAN_BREEZE,
  WorkspaceAppearanceTheme.FOREST_MIST,
  WorkspaceAppearanceTheme.SUNRISE_PEAK,
  WorkspaceAppearanceTheme.GREEN_VALLEY,
];

const APPEARANCE_CONFIG: Record<WorkspaceAppearanceTheme, WorkspaceAppearanceConfig> = {
  [WorkspaceAppearanceTheme.OCEAN_BREEZE]: {
    theme: WorkspaceAppearanceTheme.OCEAN_BREEZE,
    imageSrc: "/workspace-themes/ocean-breeze.webp",
    accent: "#1d4ed8",
    accentMuted: "rgba(29, 78, 216, 0.2)",
    dotColor: "#2563eb",
  },
  [WorkspaceAppearanceTheme.FOREST_MIST]: {
    theme: WorkspaceAppearanceTheme.FOREST_MIST,
    imageSrc: "/workspace-themes/forest-mist.webp",
    accent: "#166534",
    accentMuted: "rgba(22, 101, 52, 0.2)",
    dotColor: "#15803d",
  },
  [WorkspaceAppearanceTheme.SUNRISE_PEAK]: {
    theme: WorkspaceAppearanceTheme.SUNRISE_PEAK,
    imageSrc: "/workspace-themes/sunrise-peak.webp",
    accent: "#9a3412",
    accentMuted: "rgba(154, 52, 18, 0.2)",
    dotColor: "#c2410c",
  },
  [WorkspaceAppearanceTheme.GREEN_VALLEY]: {
    theme: WorkspaceAppearanceTheme.GREEN_VALLEY,
    imageSrc: "/workspace-themes/green-valley.webp",
    accent: "#15803d",
    accentMuted: "rgba(21, 128, 61, 0.2)",
    dotColor: "#16a34a",
  },
};

export function getAppearanceConfig(
  theme: WorkspaceAppearanceTheme | null | undefined,
): WorkspaceAppearanceConfig {
  if (theme && theme in APPEARANCE_CONFIG) {
    return APPEARANCE_CONFIG[theme];
  }
  return APPEARANCE_CONFIG[WorkspaceAppearanceTheme.OCEAN_BREEZE];
}

export function getWorkspaceStorageUsageStub(): { usedPercent: number } {
  return { usedPercent: 62 };
}
