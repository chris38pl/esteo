import type { EstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import {
  getPdfEsteoLogoDataUri,
  getPdfEsteoPromoIllustrationDataUri,
} from "@/pdf/lib/pdf-esteo-promo-assets";
import { getPdfInterFontFaceCss } from "@/pdf/lib/pdf-inter-font-face";
import { getPdfHeroImageDataUri } from "@/pdf/lib/pdf-hero-image";
import {
  pdfInfoClientIcon,
  pdfInfoInvestmentIcon,
  pdfInfoProviderIcon,
} from "@/pdf/lib/pdf-info-icons";
import {
  pdfSummaryGrossIcon,
  pdfSummaryLeadTimeIcon,
  pdfSummaryNetIcon,
  pdfSummaryVatIcon,
} from "@/pdf/lib/pdf-summary-icons";
import { estimatePdfStyles } from "@/pdf/templates/estimate-pdf-styles";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function footerContactMarkup(parts: string[]): string {
  return parts
    .map((part, index) => {
      const text = escapeHtml(part);
      if (index === 0) {
        return text;
      }

      return `<span class="page-footer-contact-sep" aria-hidden="true">•</span>${text}`;
    })
    .join("");
}

function optionalLine(label: string, value: string | null | undefined): string {
  if (!value?.trim()) {
    return "";
  }

  return `<div class="info-line"><span class="info-label">${escapeHtml(label)}</span> ${escapeHtml(value)}</div>`;
}

function loadPdfStyles(): string {
  return estimatePdfStyles;
}

function infoBlock(title: string, icon: string, lines: string): string {
  return `
    <div class="info-card">
      <div class="info-card-head">
        <span class="info-icon">${icon}</span>
        <span class="info-title">${escapeHtml(title)}</span>
      </div>
      <div class="info-body">${lines}</div>
    </div>`;
}

type EsteoPromoLabels = {
  poweredBy: string;
  headlineLine1: string;
  headlineLine2Before: string;
  headlineAccent: string;
  subline: string;
  features: [string, string, string, string];
  ctaLine1: string;
  ctaLine2: string;
  ctaButton: string;
};

function promoCheckIcon(): string {
  return `<span class="esteo-promo-check" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="currentColor"/><path d="m5.25 8 1.75 1.75L10.75 6" stroke="#fff" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
}

function buildEsteoPromoBanner(labels: EsteoPromoLabels): string {
  const logoDataUri = getPdfEsteoLogoDataUri();
  const illustrationDataUri = getPdfEsteoPromoIllustrationDataUri();

  const logoMarkup = logoDataUri
    ? `<img src="${logoDataUri}" alt="" class="esteo-promo-logo" />`
    : "";

  const illustrationMarkup = illustrationDataUri
    ? `<img src="${illustrationDataUri}" alt="" class="esteo-promo-illustration" />`
    : "";

  const featuresMarkup = labels.features
    .map(
      (feature) =>
        `<li class="esteo-promo-feature">${promoCheckIcon()}<span>${escapeHtml(feature)}</span></li>`,
    )
    .join("");

  return `
    <section class="esteo-promo" aria-label="Esteo">
      <div class="esteo-promo-inner">
        <div class="esteo-promo-brand">
          <div class="esteo-promo-powered">${escapeHtml(labels.poweredBy)}</div>
          <div class="esteo-promo-brand-row">
            ${logoMarkup}
            <span class="esteo-promo-name">Esteo</span>
          </div>
        </div>
        <div class="esteo-promo-copy">
          <p class="esteo-promo-headline">
            ${escapeHtml(labels.headlineLine1)}<br />
            ${escapeHtml(labels.headlineLine2Before)}<span class="esteo-promo-headline-accent">${escapeHtml(labels.headlineAccent)}</span>
          </p>
          <p class="esteo-promo-subline">${escapeHtml(labels.subline)}</p>
        </div>
        <div class="esteo-promo-visual" aria-hidden="true">${illustrationMarkup}</div>
        <ul class="esteo-promo-features">${featuresMarkup}</ul>
        <div class="esteo-promo-cta">
          <p class="esteo-promo-cta-text">
            ${escapeHtml(labels.ctaLine1)}<br />
            ${escapeHtml(labels.ctaLine2)}
          </p>
          <div class="esteo-promo-cta-button">
            <span class="esteo-promo-cta-globe" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.25" stroke="currentColor" stroke-width="1.1"/><path d="M2.25 8h11.5M8 2.25c2 2.25 2 9.25 0 11.5M8 2.25c-2 2.25-2 9.25 0 11.5" stroke="currentColor" stroke-width="1.1"/></svg></span>
            <span>${escapeHtml(labels.ctaButton)}</span>
            <span class="esteo-promo-cta-arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </div>
    </section>`;
}

function summaryMetric(
  iconMarkup: string,
  label: string,
  value: string,
  options?: { highlight?: boolean },
): string {
  const valueClass = options?.highlight
    ? "summary-metric-value summary-metric-value--highlight"
    : "summary-metric-value";

  return `
    <div class="summary-metric">
      ${iconMarkup}
      <div class="summary-metric-label">${escapeHtml(label)}</div>
      <div class="${valueClass}">${escapeHtml(value)}</div>
    </div>`;
}

export type BuildEstimatePdfHtmlOptions = {
  /** Paginate into visible A4 sheets in browser (admin preview only). */
  screenPagination?: boolean;
};

export function buildEstimatePdfHtml(
  model: EstimatePdfViewModel,
  options?: BuildEstimatePdfHtmlOptions,
): string {
  const labels =
    model.locale === "pl"
      ? {
          documentTitle: "WYCENA",
          issued: "Data wystawienia",
          validUntil: "Ważna do",
          provider: "DANE USŁUGODAWCY",
          client: "DANE KLIENTA",
          investment: "INWESTYCJA",
          summary: "PODSUMOWANIE WYCENY",
          net: "Wartość netto",
          vat: "VAT",
          gross: "Wartość brutto",
          leadTime: "Termin realizacji",
          lp: "LP.",
          item: "NAZWA POZYCJI",
          unit: "JEDN.",
          qty: "ILOŚĆ",
          unitPrice: "CENA JEDN. NETTO",
          netValue: "WARTOŚĆ NETTO",
          notes: "Uwagi",
          totalNet: "Wartość netto",
          totalVat: "VAT",
          totalGross: "Wartość brutto",
          footerThanks: "Dziękujemy za zaufanie!",
          taxId: "NIP",
          email: "E-mail",
          phone: "Tel.",
          propertySize: "Metraż",
          promo: {
            poweredBy: "Powered by",
            headlineLine1: "Nowoczesny system dla firm,",
            headlineLine2Before: "które chcą ",
            headlineAccent: "działać mądrzej.",
            subline: "Wyceny, klienci i płatności w jednym miejscu.",
            features: [
              "Szybkie tworzenie wycen",
              "Pełna kontrola płatności",
              "Przejrzyste raporty",
              "Bezpieczne dane",
            ],
            ctaLine1: "Dowiedz się więcej",
            ctaLine2: "i zobacz demo",
            ctaButton: "esteo.app",
          } satisfies EsteoPromoLabels,
        }
      : {
          documentTitle: "ESTIMATE",
          issued: "Issue date",
          validUntil: "Valid until",
          provider: "SERVICE PROVIDER",
          client: "CLIENT",
          investment: "INVESTMENT",
          summary: "ESTIMATE SUMMARY",
          net: "Net value",
          vat: "VAT",
          gross: "Gross value",
          leadTime: "Lead time",
          lp: "No.",
          item: "ITEM",
          unit: "Unit",
          qty: "Qty",
          unitPrice: "Unit net price",
          netValue: "Net value",
          notes: "NOTES",
          totalNet: "Net value",
          totalVat: "VAT",
          totalGross: "Gross value",
          footerThanks: "Thank you for your trust!",
          taxId: "Tax ID",
          email: "Email",
          phone: "Phone",
          propertySize: "Area",
          promo: {
            poweredBy: "Powered by",
            headlineLine1: "A modern system for companies",
            headlineLine2Before: "that want to ",
            headlineAccent: "work smarter.",
            subline: "Estimates, clients, and payments in one place.",
            features: [
              "Fast estimate creation",
              "Full payment control",
              "Clear reports",
              "Secure data",
            ],
            ctaLine1: "Learn more",
            ctaLine2: "and see the demo",
            ctaButton: "esteo.app",
          } satisfies EsteoPromoLabels,
        };

  const providerLines = [
    `<div class="info-line info-strong">${escapeHtml(model.provider.name)}</div>`,
    model.provider.address ? `<div class="info-line">${escapeHtml(model.provider.address)}</div>` : "",
    model.provider.taxId
      ? `<div class="info-line">${escapeHtml(labels.taxId)}: ${escapeHtml(model.provider.taxId)}</div>`
      : "",
    model.provider.email
      ? `<div class="info-line">${escapeHtml(labels.email)}: ${escapeHtml(model.provider.email)}</div>`
      : "",
    model.provider.phone
      ? `<div class="info-line">${escapeHtml(labels.phone)}: ${escapeHtml(model.provider.phone)}</div>`
      : "",
  ].join("");

  const clientLines = [
    model.client.name ? `<div class="info-line info-strong">${escapeHtml(model.client.name)}</div>` : "",
    model.client.address ? `<div class="info-line">${escapeHtml(model.client.address)}</div>` : "",
    model.client.propertySize
      ? `<div class="info-line">${escapeHtml(labels.propertySize)}: ${escapeHtml(model.client.propertySize)}</div>`
      : "",
    model.client.email
      ? `<div class="info-line">${escapeHtml(labels.email)}: ${escapeHtml(model.client.email)}</div>`
      : "",
    model.client.phone
      ? `<div class="info-line">${escapeHtml(labels.phone)}: ${escapeHtml(model.client.phone)}</div>`
      : "",
  ].join("");

  const investmentLines = [
    model.investment.propertyType
      ? `<div class="info-line info-strong">${escapeHtml(model.investment.propertyType)}</div>`
      : "",
    model.investment.addressStreet
      ? `<div class="info-line">${escapeHtml(model.investment.addressStreet)}</div>`
      : "",
    model.investment.addressCityLine
      ? `<div class="info-line">${escapeHtml(model.investment.addressCityLine)}</div>`
      : "",
  ].join("");

  const sectionRows = model.sections
    .map(
      (section) => `
      <tr class="section-row">
        <td colspan="5"><strong><span class="section-row-index">${section.index}.</span><span class="section-row-title">${escapeHtml(section.title)}</span></strong></td>
        <td class="num"><strong>${escapeHtml(section.sectionNet)}</strong></td>
      </tr>
      ${section.items
        .map(
          (item) => `
        <tr class="item-row">
          <td>${escapeHtml(item.index)}</td>
          <td>${escapeHtml(item.name)}</td>
          <td class="num">${escapeHtml(item.unit)}</td>
          <td class="num">${escapeHtml(item.quantity)}</td>
          <td class="num">${escapeHtml(item.unitPriceNet)}</td>
          <td class="num">${escapeHtml(item.netValue)}</td>
        </tr>`,
        )
        .join("")}`,
    )
    .join("");

  const logoMarkup = model.logoDataUri
    ? `<img src="${model.logoDataUri}" alt="" class="logo-img" />`
    : "";

  const brandMarkup = `
    <div class="brand">
      ${logoMarkup}
      <span class="brand-name">${escapeHtml(model.workspaceName)}</span>
    </div>`;

  const watermark = model.showWatermark
    ? `<div class="watermark">Wygenerowano w Esteo</div>`
    : "";

  const styles = `${getPdfInterFontFaceCss()}\n${loadPdfStyles()}`
    .replaceAll("__PRIMARY__", model.primaryColor)
    .replaceAll("__ACCENT__", model.accentColor);

  const screenPaginationScript = options?.screenPagination
    ? `<script src="https://unpkg.com/pagedjs@0.4.3/dist/paged.polyfill.js"></script>
<script>
(function () {
  function insertPageSeparators() {
    var container = document.querySelector(".pagedjs_pages");
    if (!container) return;
    container.querySelectorAll(".pdf-page-separator").forEach(function (node) {
      node.remove();
    });
    var pages = container.querySelectorAll(".pagedjs_page");
    for (var i = 0; i < pages.length - 1; i += 1) {
      var separator = document.createElement("hr");
      separator.className = "pdf-page-separator";
      separator.setAttribute("aria-hidden", "true");
      pages[i].insertAdjacentElement("afterend", separator);
    }
  }
  document.addEventListener("pagedjs:rendered", insertPageSeparators);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(insertPageSeparators, 300);
    });
  } else {
    setTimeout(insertPageSeparators, 300);
  }
})();
</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="${model.locale}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(model.viewerTitle)}</title>
  <style>${styles}</style>
</head>
<body${options?.screenPagination ? ' class="pdf-screen-preview"' : ""}>
  ${watermark}
  <div class="page">
    <header class="hero-header">
        <div class="hero-left">
        ${brandMarkup}
        <div class="doc-title">${escapeHtml(labels.documentTitle)}</div>
        <div class="ref-number">${escapeHtml(model.referenceNumber)}</div>
        <div class="dates">
          <div>${escapeHtml(labels.issued)}: ${escapeHtml(model.issueDateFormatted)}</div>
          <div>${escapeHtml(labels.validUntil)}: ${escapeHtml(model.validUntilFormatted)} (${model.validityDays} ${model.locale === "pl" ? "dni" : "days"})</div>
        </div>
      </div>
      <div class="hero-image-wrap">
        <img src="${getPdfHeroImageDataUri()}" alt="" class="hero-image" />
      </div>
    </header>

    <section class="info-grid">
      ${infoBlock(labels.provider, pdfInfoProviderIcon(), providerLines)}
      ${infoBlock(labels.client, pdfInfoClientIcon(), clientLines)}
      ${infoBlock(labels.investment, pdfInfoInvestmentIcon(), investmentLines)}
    </section>

    <section class="summary-box">
      <div class="summary-title">${escapeHtml(labels.summary)}</div>
      <div class="summary-row">
        ${summaryMetric(pdfSummaryNetIcon(), labels.net, model.totals.net)}
        ${summaryMetric(
          pdfSummaryVatIcon(),
          `${labels.vat} (${model.totals.vatRateLabel})`,
          model.totals.vat,
        )}
        ${summaryMetric(pdfSummaryGrossIcon(), labels.gross, model.totals.gross, { highlight: true })}
        ${summaryMetric(pdfSummaryLeadTimeIcon(), labels.leadTime, model.leadTimeLabel)}
      </div>
    </section>

    <table class="items-table">
      <thead>
        <tr>
          <th>${escapeHtml(labels.lp)}</th>
          <th>${escapeHtml(labels.item)}</th>
          <th>${escapeHtml(labels.unit)}</th>
          <th>${escapeHtml(labels.qty)}</th>
          <th>${escapeHtml(labels.unitPrice)}</th>
          <th>${escapeHtml(labels.netValue)}</th>
        </tr>
      </thead>
      <tbody>${sectionRows}</tbody>
    </table>

    <footer class="doc-footer">
      <div class="footer-notes">
        <div class="footer-notes-title">${escapeHtml(labels.notes)}</div>
        <p>${escapeHtml(model.notes)}</p>
      </div>
      <div class="footer-totals">
        <div class="footer-totals-body">
          <div class="footer-total-row">
            <span>${escapeHtml(labels.totalNet)}</span>
            <span>${escapeHtml(model.totals.net)}</span>
          </div>
          <div class="footer-total-row">
            <span>${escapeHtml(labels.totalVat)} (${escapeHtml(model.totals.vatRateLabel)})</span>
            <span>${escapeHtml(model.totals.vat)}</span>
          </div>
        </div>
        <div class="footer-total-row footer-total-row--gross">
          <span>${escapeHtml(labels.totalGross)}</span>
          <span>${escapeHtml(model.totals.gross)}</span>
        </div>
      </div>
    </footer>

    <footer class="page-footer">
      <div class="page-footer-thanks">${escapeHtml(labels.footerThanks)}</div>
      <div class="page-footer-contact">${footerContactMarkup(model.footerContactParts)}</div>
    </footer>

    ${buildEsteoPromoBanner(labels.promo)}
  </div>
  ${screenPaginationScript}
</body>
</html>`;
}
