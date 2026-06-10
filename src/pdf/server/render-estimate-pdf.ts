import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

import { buildEstimatePdfHtml } from "@/pdf/templates/estimate-pdf-template";
import type { EstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";

export async function renderEstimatePdfBuffer(model: EstimatePdfViewModel): Promise<Buffer> {
  const html = buildEstimatePdfHtml(model);
  const isDev = process.env.NODE_ENV === "development";

  const browser = await puppeteer.launch({
    args: isDev ? ["--no-sandbox", "--disable-setuid-sandbox"] : chromium.args,
    defaultViewport: { width: 794, height: 1123 },
    executablePath: isDev
      ? process.env.PUPPETEER_EXECUTABLE_PATH ||
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      : await chromium.executablePath(),
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
