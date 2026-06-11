import type { EstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import { getPdfHeroImageDataUri } from "@/pdf/lib/pdf-hero-image";
import { estimatePdfStyles } from "@/pdf/templates/estimate-pdf-styles";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

export function buildEstimatePdfHtml(model: EstimatePdfViewModel): string {
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
          notes: "UWAGI",
          totalNet: "Wartość netto",
          totalVat: "VAT",
          totalGross: "Wartość brutto",
          taxId: "NIP",
          email: "E-mail",
          phone: "Tel.",
          propertySize: "Metraż",
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
          taxId: "Tax ID",
          email: "Email",
          phone: "Phone",
          propertySize: "Area",
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
    model.investment.address ? `<div class="info-line">${escapeHtml(model.investment.address)}</div>` : "",
  ].join("");

  const sectionRows = model.sections
    .map(
      (section) => `
      <tr class="section-row">
        <td colspan="5"><strong>${section.index}. ${escapeHtml(section.title)}</strong></td>
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

  const sellingPoints = model.sellingPoints
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join("");

  const watermark = model.showWatermark
    ? `<div class="watermark">Wygenerowano w Esteo</div>`
    : "";

  const logoMarkup = model.logoUrl
    ? `<img src="${escapeHtml(model.logoUrl)}" alt="" class="logo-img" />`
    : `<div class="logo-fallback">Esteo</div>`;

  const styles = loadPdfStyles().replaceAll("__PRIMARY__", model.primaryColor).replaceAll(
    "__ACCENT__",
    model.accentColor,
  );

  return `<!DOCTYPE html>
<html lang="${model.locale}">
<head>
  <meta charset="utf-8" />
  <style>${styles}</style>
</head>
<body>
  ${watermark}
  <div class="page">
    <header class="hero-header">
      <div class="hero-left">
        <div class="brand">${logoMarkup}</div>
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
      ${infoBlock(labels.provider, "🏢", providerLines)}
      ${infoBlock(labels.client, "👤", clientLines)}
      ${infoBlock(labels.investment, "🏠", investmentLines)}
    </section>

    <section class="summary-box">
      <div class="summary-title">${escapeHtml(labels.summary)}</div>
      <div class="summary-cards">
        <div class="summary-card"><div class="summary-label">${escapeHtml(labels.net)}</div><div class="summary-value">${escapeHtml(model.totals.net)}</div></div>
        <div class="summary-card"><div class="summary-label">${escapeHtml(labels.vat)} (${escapeHtml(model.totals.vatRateLabel)})</div><div class="summary-value">${escapeHtml(model.totals.vat)}</div></div>
        <div class="summary-card summary-card--highlight"><div class="summary-label">${escapeHtml(labels.gross)}</div><div class="summary-value summary-value--highlight">${escapeHtml(model.totals.gross)}</div></div>
        <div class="summary-card"><div class="summary-label">${escapeHtml(labels.leadTime)}</div><div class="summary-value">${escapeHtml(model.leadTimeLabel)}</div></div>
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
        <div class="footer-total-row"><span>${escapeHtml(labels.totalNet)}</span><span>${escapeHtml(model.totals.net)}</span></div>
        <div class="footer-total-row"><span>${escapeHtml(labels.totalVat)}</span><span>${escapeHtml(model.totals.vat)}</span></div>
        <div class="footer-total-row footer-total-row--gross"><span>${escapeHtml(labels.totalGross)}</span><span>${escapeHtml(model.totals.gross)}</span></div>
      </div>
      <ul class="footer-points">${sellingPoints}</ul>
    </footer>

    <div class="page-footer">${escapeHtml(model.footerContact)}</div>
  </div>
</body>
</html>`;
}
