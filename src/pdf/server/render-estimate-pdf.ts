import puppeteer from "puppeteer-core";

import type { EstimatePdfViewModel } from "@/pdf/lib/build-pdf-view-model";
import { ensurePdfTemplateAssetsReady } from "@/pdf/lib/ensure-pdf-template-assets";
import { buildEstimatePdfHtml } from "@/pdf/templates/estimate-pdf-template";

export async function renderEstimatePdfBuffer(model: EstimatePdfViewModel): Promise<Buffer> {
  await ensurePdfTemplateAssetsReady();
  const html = buildEstimatePdfHtml(model);

  if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
    throw new Error(
      "PUPPETEER_EXECUTABLE_PATH is not configured. Trigger.dev Puppeteer extension may not be loaded.",
    );
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    defaultViewport: { width: 794, height: 1123 },
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.evaluate((title) => {
      document.title = title;
    }, model.viewerTitle);
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
