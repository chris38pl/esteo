import { ESTIMATE_LAYOUT_CONFIG } from "@/features/estimates/lib/estimate-layout-config";

const b = ESTIMATE_LAYOUT_CONFIG.breakpoints;
const side = ESTIMATE_LAYOUT_CONFIG.sideColumn;

/**
 * Human-readable breakpoint map derived from `ESTIMATE_LAYOUT_CONFIG`.
 * Re-export `ESTIMATE_LAYOUT_CONFIG` from `lib/estimate-layout-config.ts` to change behavior.
 */
export const ESTIMATE_EDITOR_LAYOUT_BREAKPOINTS = {
  headerInlineActions: `${b.headerInlineActions}px`,
  headerTitleLarge: `${b.headerInlineActions}px`,
  headerRulesLabel: `${b.headerRulesLabel}px`,
  headerStatusBadgeMinWidth: `${b.headerStatusBadgeMinWidthPx}px`,
  headerActionsDivider: `${b.headerActionsDivider}px`,
  autosaveSavedDisplayMs: ESTIMATE_LAYOUT_CONFIG.autosave.savedDisplayMs,
  topBandSplit: `${b.topBandSplit}px`,
  contextTwoCol: `${b.contextTwoCol}px`,
  contextFourCol: `${b.contextFourCol}px`,
  editorMaxWidth: `${b.editorMaxWidth}px`,
  sideColumnWidth: `${side.narrowRem}rem`,
  sideColumnWidthWide: `${side.wideRem}rem`,
  sideColumnWidthBreakpoint: `${b.sideColumnWide}px`,
  aiSideLayoutMin: `${b.aiSideLayout}px`,
  aiSideGridColumn: `${ESTIMATE_LAYOUT_CONFIG.ai.gridColumnRem}rem`,
  stickyAiTop: ESTIMATE_LAYOUT_CONFIG.stickyAi.top,
  stickyAiBottom: ESTIMATE_LAYOUT_CONFIG.stickyAi.bottom,
  stickyAiSideMinHeightVh: ESTIMATE_LAYOUT_CONFIG.stickyAi.sideMinHeightVh,
  stickyAiMessagesMaxHeight: ESTIMATE_LAYOUT_CONFIG.stickyAi.messagesMaxHeight,
} as const;

export {
  ESTIMATE_LAYOUT_CONFIG,
  getEstimateEditorResponsiveCss,
  mediaQueryMin,
} from "@/features/estimates/lib/estimate-layout-config";
