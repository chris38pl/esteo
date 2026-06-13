import { readPdfAssetBuffer } from "@/pdf/lib/read-pdf-asset";
import {
  optimizePdfImage,
  toPdfImageDataUri,
} from "@/pdf/lib/optimize-pdf-image";
import {
  PDF_ESTEO_PROMO_ILLUSTRATION_TARGET,
  PDF_ESTEO_PROMO_LOGO_TARGET,
} from "@/pdf/lib/pdf-image-targets";

let cachedLogoDataUri: string | null = null;
let cachedIllustrationDataUri: string | null | undefined;
let logoLoadPromise: Promise<void> | null = null;
let illustrationLoadPromise: Promise<void> | null = null;

async function loadLogoDataUri(): Promise<void> {
  if (cachedLogoDataUri !== null) {
    return;
  }

  const candidates = ["public/images/pdf/esteo-logo.png", "public/logo.png"];

  for (const relativePath of candidates) {
    try {
      const buffer = readPdfAssetBuffer(relativePath);
      const optimized = await optimizePdfImage(buffer, {
        ...PDF_ESTEO_PROMO_LOGO_TARGET,
        hasAlpha: true,
      });
      cachedLogoDataUri = toPdfImageDataUri(optimized);
      return;
    } catch {
      // try next candidate
    }
  }

  cachedLogoDataUri = "";
}

async function loadIllustrationDataUri(): Promise<void> {
  if (cachedIllustrationDataUri !== undefined) {
    return;
  }

  try {
    const buffer = readPdfAssetBuffer("public/images/pdf/esteo-promo.webp");
    const optimized = await optimizePdfImage(buffer, PDF_ESTEO_PROMO_ILLUSTRATION_TARGET);
    cachedIllustrationDataUri = toPdfImageDataUri(optimized);
  } catch {
    cachedIllustrationDataUri = null;
  }
}

async function ensureLogoReady(): Promise<void> {
  if (cachedLogoDataUri !== null) {
    return;
  }

  if (!logoLoadPromise) {
    logoLoadPromise = loadLogoDataUri();
  }

  await logoLoadPromise;
}

async function ensureIllustrationReady(): Promise<void> {
  if (cachedIllustrationDataUri !== undefined) {
    return;
  }

  if (!illustrationLoadPromise) {
    illustrationLoadPromise = loadIllustrationDataUri();
  }

  await illustrationLoadPromise;
}

/** Preload resized Esteo promo assets before synchronous template rendering. */
export async function ensurePdfEsteoPromoAssetsReady(): Promise<void> {
  await Promise.all([ensureLogoReady(), ensureIllustrationReady()]);
}

/** Owl logo for the Esteo promo banner (copy from `public/logo.png`). */
export function getPdfEsteoLogoDataUri(): string | null {
  if (cachedLogoDataUri === "") {
    return null;
  }

  return cachedLogoDataUri;
}

/** Center illustration for the Esteo promo banner. */
export function getPdfEsteoPromoIllustrationDataUri(): string | null {
  return cachedIllustrationDataUri ?? null;
}
