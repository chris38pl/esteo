import { cn } from "@/lib/utils";

/** Mobile: edge-to-edge in portal. sm+: floating card. */
export const voiceRecordingStageShellClassName = cn(
  "w-full shrink-0",
  "max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent",
  "max-sm:px-4 max-sm:py-2 max-sm:shadow-none max-sm:backdrop-blur-none",
  "sm:max-w-[26rem] sm:rounded-[1.75rem] sm:border sm:border-border/50 sm:bg-card/95",
  "sm:px-6 sm:py-7 sm:shadow-2xl sm:shadow-black/10 sm:backdrop-blur-md",
  "dark:sm:bg-card/90 dark:sm:shadow-black/40",
);
