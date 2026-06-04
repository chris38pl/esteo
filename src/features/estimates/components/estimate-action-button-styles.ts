import { ESTIMATE_LAYOUT_CONFIG } from "@/features/estimates/lib/estimate-layout-config";

/** Shared header / toolbar action button styles for the estimate editor (aligned with default h-9 buttons). */
export const estimateOutlineButtonClassName =
  "inline-flex h-9 min-h-9 min-w-0 items-center justify-center gap-2 rounded-md border-blue-200 bg-background px-4 text-sm font-medium text-blue-600 shadow-xs hover:bg-blue-50 hover:text-blue-700 sm:min-w-[7.25rem] sm:px-5 dark:border-input dark:bg-card dark:text-foreground dark:hover:bg-accent [&_svg]:shrink-0";

export const estimatePrimaryButtonClassName =
  "inline-flex h-9 min-h-9 min-w-0 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-medium text-white shadow-xs hover:bg-blue-700 sm:min-w-[7.25rem] sm:px-5 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90";

/** Visible vertical rule between header action groups. */
export const estimateHeaderActionsDividerClassName =
  ESTIMATE_LAYOUT_CONFIG.tailwind.headerActionsDivider;

/** Status / autosave badge — same footprint as header outline buttons. */
export const estimateHeaderStatusBadgeClassName =
  "inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-background px-4 text-sm font-medium shadow-xs dark:border-input dark:bg-card sm:min-w-[7.25rem] sm:px-5 [&_svg]:size-4 [&_svg]:shrink-0";
