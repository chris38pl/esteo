/** Inline SVG icons for PDF summary metrics (Puppeteer-safe, no external fonts). */

function iconWrap(svg: string): string {
  return `<span class="summary-metric-icon" aria-hidden="true">${svg}</span>`;
}

const svgAttrs =
  'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"';

export function pdfSummaryNetIcon(): string {
  return iconWrap(
    `<svg ${svgAttrs}><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`,
  );
}

export function pdfSummaryVatIcon(): string {
  return iconWrap(
    `<svg ${svgAttrs}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h3"/><path d="M8 17h8"/><path d="M8 9h.01"/></svg>`,
  );
}

export function pdfSummaryGrossIcon(): string {
  return iconWrap(
    `<svg ${svgAttrs}><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6a2 2 0 0 0 0 4h12a1 1 0 0 0 1-1v-3"/><path d="M3 5v14"/></svg>`,
  );
}

export function pdfSummaryLeadTimeIcon(): string {
  return iconWrap(
    `<svg ${svgAttrs}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
  );
}
