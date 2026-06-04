/** Borderless table cell inputs (line items + section titles). */
export const estimateFlatInputClassName =
  "h-8 min-w-0 rounded-none border-0! bg-transparent! px-1 text-sm shadow-none! hover:bg-transparent focus-visible:border-0! focus-visible:ring-0! dark:border-0! dark:bg-transparent! dark:shadow-none! dark:hover:bg-transparent dark:focus-visible:border-0! dark:focus-visible:ring-0!";

/**
 * Section header row — slightly lighter than line items, a step darker than before.
 */
export const estimateSectionRowClassName =
  "bg-secondary/45 text-sm dark:bg-muted";

/**
 * Line item row — darkest table rows.
 * Light: secondary (#f1f5f9); dark: background (#060b16).
 */
export const estimateLineItemRowClassName =
  "group border-b border-border/40 bg-secondary transition-colors dark:bg-background hover:bg-secondary/80 dark:hover:bg-background";
