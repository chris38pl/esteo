import { readPdfAssetBuffer } from "@/pdf/lib/read-pdf-asset";

const PDF_HERO_GRADIENT_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e3a5f'/%3E%3Cstop offset='100%25' stop-color='%233b82c4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='400' fill='url(%23g)'/%3E%3C/svg%3E";

let cachedHeroDataUri: string | null = null;

/** Stock hero image for PDF rendering (Puppeteer-safe data URI). */
export function getPdfHeroImageDataUri(): string {
  if (cachedHeroDataUri) {
    return cachedHeroDataUri;
  }

  try {
    const buffer = readPdfAssetBuffer("public/images/pdf/hero-house.jpg");
    cachedHeroDataUri = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    return cachedHeroDataUri;
  } catch {
    cachedHeroDataUri = PDF_HERO_GRADIENT_FALLBACK;
    return cachedHeroDataUri;
  }
}
