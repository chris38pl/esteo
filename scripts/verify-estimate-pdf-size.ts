import { createEstimatePdfPreviewFixture } from "@/pdf/fixtures/estimate-pdf-preview.fixture";
import { renderEstimatePdfBuffer } from "@/pdf/server/render-estimate-pdf";

const MAX_PDF_BYTES = 800_000;

async function main() {
  if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.error("Set PUPPETEER_EXECUTABLE_PATH to your local Chrome executable.");
    process.exit(1);
  }

  const model = createEstimatePdfPreviewFixture({ locale: "pl" });
  const buffer = await renderEstimatePdfBuffer(model);
  const sizeKb = Math.round(buffer.length / 1024);

  console.log(`Estimate PDF size: ${buffer.length} bytes (${sizeKb} KB)`);

  if (buffer.length > MAX_PDF_BYTES) {
    console.error(`FAIL: exceeds ${MAX_PDF_BYTES} byte target`);
    process.exit(1);
  }

  console.log(`PASS: under ${MAX_PDF_BYTES} byte target`);
}

void main();
