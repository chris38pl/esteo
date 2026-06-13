/**
 * Single source of truth for estimate editor layout breakpoints.
 *
 * **Change `breakpoints` only** — most layout CSS is generated via `getEstimateEditorResponsiveCss()`.
 * Header inline actions, title size, rules label: injected CSS (not dynamic Tailwind).
 * Remaining `tailwind` entries use literal classes or generated CSS where noted.
 */

const estimateLayoutBreakpoints = {
  /** Header: Podgląd inline; title text-2xl */
  headerInlineActions: 1424,
  /** Reguły zastosowane — label visible at/above; icon-only below */
  headerRulesLabel: 1600,
  /** Status badge min-width in px (limits label jump between autosave states) */
  headerStatusBadgeMinWidthPx: 140,
  /** Header: title row vs actions row; vertical divider between action groups */
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

/** Tab card shell: Kosztorys + Podsumowanie = full width; other tabs = narrower reading width */
const estimateLayoutTabShell = {
  narrowMaxRem: 64,
  transitionDurationMs: 300,
  transitionEasing: "cubic-bezier(0.22, 1, 0.36, 1)",
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
  /** Always visible in Więcej menu (not hidden when inline Preview shows) */
  headerMoreMenuPinAction: "estimate-header-more-menu-pin-action",
  header:
    "estimate-header flex min-w-0 flex-col gap-3",
  headerPrimary: "estimate-header__primary flex min-w-0 items-start gap-2",
  headerMobileMeta:
    "estimate-header__mobile-meta flex min-w-0 flex-wrap items-center gap-2.5",
  headerDesktopActions:
    "estimate-header__desktop-actions flex min-w-0 max-w-full flex-wrap items-center gap-2.5",
  headerActions:
    "estimate-header__actions flex min-w-0 max-w-full flex-wrap items-center gap-2.5",
  headerSendAction: "estimate-header-send",
  mobileStickyBar: "estimate-mobile-sticky-bar",
  editorMobileStickyPadding: "estimate-editor--mobile-sticky",
  itemsDesktop: "estimate-items-desktop",
  itemsMobile: "estimate-items-mobile",
  itemsToolbarMobile: "estimate-items-toolbar-mobile",
  editorTabsDesktop: "estimate-editor-tabs__desktop",
  editorTabsMobile: "estimate-editor-tabs__mobile",
  editorTabsExpandDesktop: "estimate-editor-tabs__expand-desktop",
  editorTabShell: "estimate-editor-tab-shell",
  editorTabShellNarrow: "estimate-editor-tab-shell--narrow",
  headerTitle:
    "estimate-header__title text-xl font-semibold tracking-tight text-foreground",
  headerStatusBadgeMinWidth: `min-w-[${b.headerStatusBadgeMinWidthPx}px]`,
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
  tabShell: estimateLayoutTabShell,
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

export const estimateHeaderClass = ESTIMATE_LAYOUT_CONFIG.tailwind.header;

export const estimateHeaderPrimaryClass = ESTIMATE_LAYOUT_CONFIG.tailwind.headerPrimary;

export const estimateHeaderMobileMetaClass = ESTIMATE_LAYOUT_CONFIG.tailwind.headerMobileMeta;

export const estimateHeaderDesktopActionsClass =
  ESTIMATE_LAYOUT_CONFIG.tailwind.headerDesktopActions;

export const estimateHeaderActionsClass = ESTIMATE_LAYOUT_CONFIG.tailwind.headerActions;

export const estimateHeaderSendActionClass = ESTIMATE_LAYOUT_CONFIG.tailwind.headerSendAction;

export const estimateMobileStickyBarClass = ESTIMATE_LAYOUT_CONFIG.tailwind.mobileStickyBar;

export const estimateEditorMobileStickyPaddingClass =
  ESTIMATE_LAYOUT_CONFIG.tailwind.editorMobileStickyPadding;

export const estimateItemsDesktopClass = ESTIMATE_LAYOUT_CONFIG.tailwind.itemsDesktop;

export const estimateItemsMobileClass = ESTIMATE_LAYOUT_CONFIG.tailwind.itemsMobile;

export const estimateItemsToolbarMobileClass = ESTIMATE_LAYOUT_CONFIG.tailwind.itemsToolbarMobile;

export const estimateEditorTabsDesktopClass = ESTIMATE_LAYOUT_CONFIG.tailwind.editorTabsDesktop;

export const estimateEditorTabsMobileClass = ESTIMATE_LAYOUT_CONFIG.tailwind.editorTabsMobile;

export const estimateEditorTabsExpandDesktopClass =
  ESTIMATE_LAYOUT_CONFIG.tailwind.editorTabsExpandDesktop;

export const estimateEditorTabShellClass = ESTIMATE_LAYOUT_CONFIG.tailwind.editorTabShell;

export const estimateEditorTabShellNarrowClass =
  ESTIMATE_LAYOUT_CONFIG.tailwind.editorTabShellNarrow;

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

  const tabShell = ESTIMATE_LAYOUT_CONFIG.tabShell;

  return `
.estimate-editor {
  --estimate-side-column-width: ${side.narrowRem}rem;
}
.estimate-editor-tab-shell {
  width: 100%;
  max-width: 100%;
  margin-right: auto;
  transition: max-width ${tabShell.transitionDurationMs}ms ${tabShell.transitionEasing};
}
.estimate-editor-tab-shell--narrow {
  max-width: ${tabShell.narrowMaxRem}rem;
}
@media (prefers-reduced-motion: reduce) {
  .estimate-editor-tab-shell {
    transition: none;
  }
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
  .estimate-context-grid > *:not(:last-child)::before {
    content: none;
  }
  .estimate-context-grid > *:nth-child(-n + 2)::before {
    content: "";
    position: absolute;
    z-index: 1;
    bottom: 0;
    left: 12.5%;
    width: 75%;
    height: 1px;
    background: var(--estimate-context-divider);
  }
  .estimate-context-grid > *:not(:nth-child(2n))::after {
    content: "";
    position: absolute;
    z-index: 1;
    top: 12.5%;
    right: 0;
    width: 1px;
    height: 75%;
    background: var(--estimate-context-divider);
  }
}
@media ${mediaQueryMin(breakpoints.contextTwoCol)} and ${mediaQueryMax(breakpoints.contextFourCol - 1)} {
  .estimate-context-card {
    gap: 0.625rem;
    padding: 0.875rem 1rem;
  }
  .estimate-context-card__icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.625rem;
  }
  .estimate-context-card__icon svg {
    width: 1rem;
    height: 1rem;
  }
  .estimate-context-card__primary {
    font-size: 0.75rem;
    line-height: 1.125rem;
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
    grid-template-rows: minmax(8.75rem, 1fr);
  }
  .estimate-context-grid > *::before {
    content: none;
  }
  .estimate-context-grid > *:not(:nth-child(2n))::after {
    content: none;
  }
  .estimate-context-grid > *:not(:last-child)::after {
    content: "";
    position: absolute;
    z-index: 1;
    top: 12.5%;
    right: 0;
    width: 1px;
    height: 75%;
    background: var(--estimate-context-divider);
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
.estimate-header__title input {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  padding: 0 !important;
}
.dark .estimate-header__title input,
.dark .estimate-header__title input:hover,
.dark .estimate-header__title input:focus,
.dark .estimate-header__title input:focus-visible {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
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
.estimate-header__status-desktop {
  display: none;
}
.estimate-header__mobile-meta {
  display: flex;
}
.estimate-header__desktop-actions {
  display: none;
}
.estimate-header-send {
  display: none !important;
}
.estimate-mobile-sticky-bar {
  display: flex;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  width: 100%;
  max-width: 100%;
}
.estimate-items-desktop {
  display: none;
}
.estimate-items-mobile {
  display: block;
}
.estimate-editor-tabs__desktop {
  display: none;
  min-width: 0;
  flex: 1 1 auto;
}
.estimate-editor-tabs__mobile {
  display: flex;
}
.estimate-editor-tabs__expand-desktop {
  display: none;
}
.estimate-editor--mobile-sticky {
  padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px));
}
@media ${mediaQueryMax(breakpoints.headerActionsDivider - 1)} {
  .estimate-top-band--basic .estimate-side-rail {
    max-width: none;
    width: 100%;
  }
  [data-estimate-ai-floating] button.fixed.bottom-4 {
    bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px) + 0.75rem);
  }
  [data-estimate-ai-floating] .estimate-ai-floating-panel {
    bottom: calc(9.5rem + env(safe-area-inset-bottom, 0px));
  }
}
@media ${mediaQueryMin(breakpoints.headerActionsDivider)} {
  .estimate-header {
    flex-direction: row;
    align-items: flex-start;
  }
  .estimate-header__primary {
    flex: 1 1 auto;
  }
  .estimate-header__status-desktop {
    display: flex;
  }
  .estimate-header__mobile-meta {
    display: none;
  }
  .estimate-header__desktop-actions {
    display: flex;
    margin-left: auto;
    justify-content: flex-end;
  }
  .estimate-header-send {
    display: inline-flex !important;
  }
  .estimate-header-actions-divider {
    display: block !important;
  }
  .estimate-items-desktop {
    display: block;
  }
  .estimate-items-mobile {
    display: none;
  }
  .estimate-editor-tabs__desktop {
    display: flex;
  }
  .estimate-editor-tabs__mobile {
    display: none;
  }
  .estimate-editor-tabs__expand-desktop {
    display: flex;
  }
  .estimate-mobile-sticky-bar {
    display: none !important;
  }
  .estimate-editor--mobile-sticky {
    padding-bottom: 2rem;
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
.estimate-profitability-margin-badge__input,
.estimate-profitability-margin-badge__input:focus,
.estimate-profitability-margin-badge__input:focus-visible {
  appearance: none;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  outline: none !important;
}
@media ${mediaQueryMax(breakpoints.headerActionsDivider - 1)} {
  .estimate-right-rail__grid--advanced {
    grid-template-columns: 1fr;
  }
  .estimate-right-rail__profitability {
    border-left: none;
    border-top: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  }
}
`.trim();
}
