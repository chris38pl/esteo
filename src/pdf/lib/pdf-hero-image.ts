import { readPdfAssetBuffer } from "@/pdf/lib/read-pdf-asset";
import {
  optimizePdfImage,
  toPdfImageDataUri,
} from "@/pdf/lib/optimize-pdf-image";
import { PDF_HERO_IMAGE_TARGET } from "@/pdf/lib/pdf-image-targets";

const PDF_HERO_GRADIENT_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='400' viewBox='0 0 800 400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231e3a5f'/%3E%3Cstop offset='100%25' stop-color='%233b82c4'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='800' height='400' fill='url(%23g)'/%3E%3C/svg%3E";

let cachedHeroDataUri: string | null = null;
let loadPromise: Promise<void> | null = null;

async function loadHeroDataUri(): Promise<void> {
  if (cachedHeroDataUri) {
    return;
  }

  try {
    const buffer = readPdfAssetBuffer("public/images/pdf/hero-house.webp");
    const optimized = await optimizePdfImage(buffer, PDF_HERO_IMAGE_TARGET);
    cachedHeroDataUri = toPdfImageDataUri(optimized);
  } catch {
    cachedHeroDataUri = PDF_HERO_GRADIENT_FALLBACK;
  }
}

/** Preload resized hero image before synchronous template rendering. */
export async function ensurePdfHeroImageReady(): Promise<void> {
  if (cachedHeroDataUri) {
    return;
  }

  if (!loadPromise) {
    loadPromise = loadHeroDataUri();
  }

  await loadPromise;
}

/** Stock hero image for PDF rendering (Puppeteer-safe data URI). */
export function getPdfHeroImageDataUri(): string {
  return cachedHeroDataUri ?? PDF_HERO_GRADIENT_FALLBACK;
}
