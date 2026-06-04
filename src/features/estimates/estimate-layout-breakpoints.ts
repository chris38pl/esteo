/**
 * Reference for estimate editor layout breakpoints.
 *
 * **Edit the real values in:**
 * `src/features/estimates/styles/estimate-editor-layout.css`
 * (see the comment block at the top of that file)
 */
export const ESTIMATE_EDITOR_LAYOUT_BREAKPOINTS = {
  /** Context cards | summary + profitability side-by-side */
  topBandSplit: "1200px",
  /** Context cards 2×2 grid */
  contextTwoCol: "768px",
  /** All four context cards in one row */
  contextFourCol: "1500px",
  /** Centered editor max width (Tailwind on estimate-editor.tsx) */
  editorMaxWidth: "1760px",
  /** Sticky AI offset — edit in estimate-editor-layout.css (.estimate-ai-sticky) */
  stickyAiTop: "calc(3.5rem + 1rem)",
  stickyAiHeight: "calc(100dvh - 3.5rem - 2rem)",
} as const;
