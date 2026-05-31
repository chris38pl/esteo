import type { WorkspaceAppearanceTheme } from "@prisma/client";

import { getAppearanceConfig } from "@/features/workspaces/lib/workspace-appearance";
import { cn } from "@/lib/utils";

export function ThemedWorkspaceIcon({
  name,
  theme,
  size = 48,
  className,
}: {
  name: string;
  theme: WorkspaceAppearanceTheme | null | undefined;
  size?: number;
  className?: string;
}) {
  const config = getAppearanceConfig(theme);
  const letter = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[14px] border font-semibold leading-none",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        backgroundColor: config.accentMuted,
        borderColor: `${config.accent}33`,
        color: config.accent,
      }}
      aria-hidden
    >
      {letter}
    </span>
  );
}
