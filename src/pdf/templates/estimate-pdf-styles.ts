/**
 * PDF stylesheet bundled for Puppeteer HTML.
 * Source of truth for editing: estimate-pdf.css (keep in sync when changing layout).
 * Inlined here so Trigger.dev workers do not depend on src/ at runtime.
 */
export const estimatePdfStyles = `@page {
  size: A4;
  margin: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Segoe UI", Arial, sans-serif;
  font-size: 10px;
  color: #1f2937;
  background: #fff;
}

.page {
  position: relative;
  padding: 28px 32px 40px;
  min-height: 297mm;
}

.watermark {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  color: rgba(37, 99, 235, 0.08);
  transform: rotate(-35deg);
  pointer-events: none;
  z-index: 0;
}

.hero-header {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.hero-left {
  min-width: 0;
}

.brand {
  margin-bottom: 12px;
}

.logo-img {
  max-height: 36px;
  max-width: 140px;
  object-fit: contain;
}

.logo-fallback {
  font-size: 22px;
  font-weight: 800;
  color: __PRIMARY__;
}

.doc-title {
  font-size: 11px;
  letter-spacing: 0.12em;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 4px;
}

.ref-number {
  font-size: 28px;
  font-weight: 800;
  color: __PRIMARY__;
  line-height: 1.1;
  margin-bottom: 10px;
}

.dates {
  color: #475569;
  line-height: 1.5;
}

.hero-image-wrap {
  position: relative;
  height: 120px;
  overflow: hidden;
  clip-path: polygon(18% 0, 100% 0, 100% 100%, 0 100%);
  border-radius: 0 8px 8px 0;
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.info-card {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  min-height: 120px;
}

.info-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: __PRIMARY__;
  font-weight: 700;
  font-size: 9px;
  letter-spacing: 0.06em;
}

.info-icon {
  font-size: 14px;
}

.info-body {
  line-height: 1.45;
  color: #334155;
}

.info-line {
  margin-bottom: 3px;
}

.info-strong {
  font-weight: 700;
  color: #0f172a;
}

.summary-box {
  border: 1px solid __ACCENT__;
  background: linear-gradient(180deg, __ACCENT__ 0%, #fff 100%);
  border-radius: 12px;
  padding: 14px 16px 16px;
  margin-bottom: 18px;
}

.summary-title {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: __PRIMARY__;
  margin-bottom: 10px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.summary-card {
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  padding: 10px;
}

.summary-card--highlight {
  border-color: __PRIMARY__;
  background: __ACCENT__;
}

.summary-label {
  font-size: 8px;
  color: #64748b;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

.summary-value--highlight {
  color: __PRIMARY__;
  font-size: 14px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
}

.items-table th {
  text-align: left;
  font-size: 8px;
  letter-spacing: 0.05em;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px 6px;
}

.items-table td {
  padding: 7px 6px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.items-table .num {
  text-align: right;
  white-space: nowrap;
}

.section-row td {
  background: #f8fafc;
  padding-top: 10px;
}

.doc-footer {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr;
  gap: 14px;
  align-items: start;
}

.footer-notes-title {
  font-weight: 700;
  color: __PRIMARY__;
  margin-bottom: 6px;
}

.footer-notes p {
  margin: 0;
  line-height: 1.45;
  color: #475569;
}

.footer-totals {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px;
}

.footer-total-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  color: #334155;
}

.footer-total-row--gross {
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  background: __ACCENT__;
  color: __PRIMARY__;
  font-weight: 800;
}

.footer-points {
  margin: 0;
  padding-left: 16px;
  color: #334155;
  line-height: 1.5;
}

.page-footer {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  color: __PRIMARY__;
  font-size: 8px;
}`;
