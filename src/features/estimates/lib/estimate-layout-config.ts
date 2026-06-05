/**
 * Single source of truth for estimate editor layout breakpoints.
 *
 * **Change `breakpoints` only** — most layout CSS is generated via `getEstimateEditorResponsiveCss()`.
 * Header inline actions, title size, rules label: injected CSS (not dynamic Tailwind).
 * Remaining `tailwind` entries use literal classes or generated CSS where noted.
 */

const estimateLayoutBreakpoints = {
  /** Header: Podgląd / Udostępnij inline; title text-2xl */
  headerInlineActions: 1424,
  /** Reguły zastosowane — label visible at/above; icon-only below */
  headerRulesLabel: 1600,
  /** Status badge min-width (limits label jump) */
  headerStatusBadge: 1200,
  /** Header vertical divider between action groups */
  headerActionsDivider: 900,
  /** Context cards 2×2 */
  contextTwoCol: 768,
  /** Context cards 4 in one row */
  contextFourCol: 1800,
  /** Context cards | summary/profitability rail side-by-side */
  topBandSplit: 1200,
  /** Editor page max width */
  editorMaxWidth: 1760,
  /** `--estimate-side-column-width` → wideRem */
  sideColumnWide: 1400,
  /** AI side column vs floating FAB; grid only when `useEstimateAiSideLayout()` */
  aiSideLayout: 1400,
} as const;

const estimateLayoutSideColumn = {
  narrowRem: 18,
  wideRem: 20,
} as const;

const estimateLayoutAi = {
  gridColumnRem: 20,
} as const;

/** Top band when advanced: context cards (left) vs summary + profitability (right) */
const estimateLayoutTopBandAdvanced = {
  /** Context 2×2 (< `breakpoints.contextFourCol`) — left needs less width; widen summary/profitability */
  whenContextStacked: {
    leftFr: 1,
    rightColumnClampRem: { min: 34, max: 44 },
    rightColumnPreferredPercent: 42,
  },
  /** Context 4-across (≥ `breakpoints.contextFourCol`) — wider summary/profitability rail */
  whenContextFourCol: {
    leftFr: 1.2,
    rightColumnClampRem: { min: 44, max: 83 },
    rightColumnPreferredPercent: 38.4,
  },
} as const;

function topBandAdvancedGridColumns(
  profile:
    | (typeof estimateLayoutTopBandAdvanced)["whenContextStacked"]
    | (typeof estimateLayoutTopBandAdvanced)["whenContextFourCol"],
): string {
  const { leftFr, rightColumnClampRem, rightColumnPreferredPercent } = profile;
  return `minmax(0, ${leftFr}fr) clamp(
      ${rightColumnClampRem.min}rem,
      ${rightColumnPreferredPercent}%,
      ${rightColumnClampRem.max}rem
    )`;
}

const b = estimateLayoutBreakpoints;

const estimateLayoutTailwind = {
  /** Requires injected CSS from `getEstimateEditorResponsiveCss()` — not dynamic Tailwind */
  editorMaxWidth: "estimate-editor-max-width",
  headerInlineActionButton: "estimate-header-inline-action",
  headerInlineActionMenuItem: "estimate-header-more-menu-inline-action",
  /** Always visible in Więcej menu (not hidden when inline Preview/Share show) */
  headerMoreMenuPinAction: "estimate-header-more-menu-pin-action",
  headerTitle:
    "estimate-header__title truncate text-xl font-semibold tracking-tight text-foreground",
  headerStatusBadgeMinWidth: `min-w-[${b.headerStatusBadge}px]`,
  headerActionsDivider:
    "estimate-header-actions-divider mx-1 hidden h-9 w-px shrink-0 self-center bg-border",
  rightRailAdvancedGrid: "estimate-right-rail__grid estimate-right-rail__grid--advanced",
  /** Injected CSS in `getEstimateEditorResponsiveCss()` — not dynamic Tailwind */
  aiSideGrid: "estimate-editor-ai-grid",
} as const;

export const ESTIMATE_LAYOUT_CONFIG = {
  breakpoints: estimateLayoutBreakpoints,
  sideColumn: estimateLayoutSideColumn,
  topBandAdvanced: estimateLayoutTopBandAdvanced,
  ai: estimateLayoutAi,
  autosave: {
    savedDisplayMs: 2000,
  },
  stickyAi: {
    top: "calc(3.5rem + 1rem)",
    bottom: "1rem",
    /** Side-column AI only (≥ `breakpoints.aiSideLayout`); not floating popup */
    sideMinHeightVh: 60,
    messagesMaxHeight: "min(18rem, calc(100dvh - 14rem))",
  },
  tailwind: estimateLayoutTailwind,
} as const;

export type EstimateLayoutBreakpoints = typeof ESTIMATE_LAYOUT_CONFIG.breakpoints;

/** @deprecated Use ESTIMATE_LAYOUT_CONFIG.breakpoints.aiSideLayout */
export const ESTIMATE_AI_SIDE_LAYOUT_MIN_PX =
  ESTIMATE_LAYOUT_CONFIG.breakpoints.aiSideLayout;

export const estimateEditorAiSideGridClass = ESTIMATE_LAYOUT_CONFIG.tailwind.aiSideGrid;

export const ESTIMATE_HEADER_INLINE_ACTIONS_MIN_PX =
  ESTIMATE_LAYOUT_CONFIG.breakpoints.headerInlineActions;

export const estimateHeaderInlineActionButtonClass =
  ESTIMATE_LAYOUT_CONFIG.tailwind.headerInlineActionButton;

export const estimateHeaderInlineActionMenuItemClass =
  ESTIMATE_LAYOUT_CONFIG.tailwind.headerInlineActionMenuItem;

export const estimateHeaderMoreMenuPinActionClass =
  ESTIMATE_LAYOUT_CONFIG.tailwind.headerMoreMenuPinAction;

export const ESTIMATE_HEADER_TITLE_LARGE_MIN_PX =
  ESTIMATE_LAYOUT_CONFIG.breakpoints.headerInlineActions;

export const estimateHeaderTitleClass = ESTIMATE_LAYOUT_CONFIG.tailwind.headerTitle;

export const ESTIMATE_HEADER_STATUS_BADGE_MIN_WIDTH =
  ESTIMATE_LAYOUT_CONFIG.tailwind.headerStatusBadgeMinWidth;

export const estimateEditorMaxWidthClass = ESTIMATE_LAYOUT_CONFIG.tailwind.editorMaxWidth;

export const SAVED_DISPLAY_MS = ESTIMATE_LAYOUT_CONFIG.autosave.savedDisplayMs;

export function mediaQueryMin(px: number): string {
  return `(min-width: ${px}px)`;
}

export function mediaQueryMax(px: number): string {
  return `(max-width: ${px}px)`;
}

export function getEstimateEditorResponsiveCss(): string {
  const breakpoints = ESTIMATE_LAYOUT_CONFIG.breakpoints;
  const side = ESTIMATE_LAYOUT_CONFIG.sideColumn;
  const topAdvanced = ESTIMATE_LAYOUT_CONFIG.topBandAdvanced;
  const ai = ESTIMATE_LAYOUT_CONFIG.ai;

  return `
.estimate-editor {
  --estimate-side-column-width: ${side.narrowRem}rem;
}
@media ${mediaQueryMin(breakpoints.sideColumnWide)} {
  .estimate-editor {
    --estimate-side-column-width: ${side.wideRem}rem;
  }
}
@media ${mediaQueryMin(breakpoints.topBandSplit)} {
  .estimate-top-band:not(.estimate-top-band--stacked).estimate-top-band--basic {
    grid-template-columns: minmax(0, 1fr) var(--estimate-side-column-width);
  }
  .estimate-top-band:not(.estimate-top-band--stacked).estimate-top-band--advanced {
    grid-template-columns: ${topBandAdvancedGridColumns(topAdvanced.whenContextStacked)};
  }
  .estimate-top-band--basic .estimate-side-rail {
    justify-self: end;
  }
  .estimate-top-band--advanced .estimate-side-rail {
    max-width: none;
    justify-self: stretch;
  }
}
@media ${mediaQueryMin(breakpoints.contextTwoCol)} {
  .estimate-context-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .estimate-context-grid > * {
    border-right: 1px solid var(--estimate-context-divider);
  }
  .estimate-context-grid > *:nth-child(2n) {
    border-right: none;
  }
  .estimate-context-grid > *:nth-child(n + 3) {
    border-bottom: none;
  }
}
@media ${mediaQueryMin(breakpoints.contextFourCol)} {
  .estimate-editor,
  .estimate-editor-max-width {
    max-width: ${breakpoints.editorMaxWidth}px;
  }
  .estimate-top-band:not(.estimate-top-band--stacked).estimate-top-band--advanced {
    grid-template-columns: ${topBandAdvancedGridColumns(topAdvanced.whenContextFourCol)};
  }
  .estimate-context-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .estimate-context-grid > * {
    border-bottom: none;
    border-right: 1px solid var(--estimate-context-divider);
  }
  .estimate-context-grid > *:last-child {
    border-right: none;
  }
}
.estimate-rules-indicator__label {
  display: none;
}
@media ${mediaQueryMin(breakpoints.headerRulesLabel)} {
  .estimate-rules-indicator__label {
    display: inline;
  }
}
@media ${mediaQueryMax(breakpoints.headerRulesLabel - 1)} {
  .estimate-rules-indicator {
    min-width: 2.25rem !important;
    width: 2.25rem !important;
    max-width: 2.25rem !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
}
.estimate-header-inline-action {
  display: none !important;
}
.estimate-header-more-menu-inline-action {
  display: flex;
}
.estimate-header-more-menu-pin-action {
  display: flex;
}
@media ${mediaQueryMin(breakpoints.headerInlineActions)} {
  .estimate-header-inline-action {
    display: inline-flex !important;
  }
  .estimate-header-more-menu-inline-action {
    display: none !important;
  }
  .estimate-header__title {
    font-size: 1.5rem;
    line-height: 2rem;
  }
}
.estimate-header-actions-divider {
  display: none !important;
}
@media ${mediaQueryMin(breakpoints.headerActionsDivider)} {
  .estimate-header-actions-divider {
    display: block !important;
  }
}
/* Table + side AI (≥ breakpoints.aiSideLayout via useEstimateAiSideLayout) */
.estimate-editor-ai-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, ${ai.gridColumnRem}rem);
  gap: 1.5rem;
  align-items: start;
  min-width: 0;
}
/* PODSUMOWANIE | RENTOWNOŚĆ — side-by-side whenever advanced rail is shown */
.estimate-right-rail__grid--advanced {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
  min-width: 0;
  width: 100%;
}
.estimate-right-rail__grid--advanced > * {
  min-width: 0;
}
.estimate-right-rail__summary {
  border-top: none;
  border-left: none;
}
.estimate-right-rail__profitability {
  border-top: none;
  border-left: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
}
`.trim();
}
