import { readPdfAssetBuffer } from "@/pdf/lib/read-pdf-asset";

let cachedLogoDataUri: string | null = null;
let cachedIllustrationDataUri: string | null | undefined;

function toDataUri(relativePath: string, mime: string): string {
  const buffer = readPdfAssetBuffer(relativePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/** Owl logo for the Esteo promo banner (copy from `public/logo.png`). */
export function getPdfEsteoLogoDataUri(): string | null {
  if (cachedLogoDataUri !== null) {
    return cachedLogoDataUri;
  }

  try {
    cachedLogoDataUri = toDataUri("public/images/pdf/esteo-logo.png", "image/png");
    return cachedLogoDataUri;
  } catch {
    try {
      cachedLogoDataUri = toDataUri("public/logo.png", "image/png");
      return cachedLogoDataUri;
    } catch {
      cachedLogoDataUri = "";
      return null;
    }
  }
}

/** Center illustration for the Esteo promo banner. */
export function getPdfEsteoPromoIllustrationDataUri(): string | null {
  if (cachedIllustrationDataUri !== undefined) {
    return cachedIllustrationDataUri;
  }

  try {
    cachedIllustrationDataUri = toDataUri("public/images/pdf/esteo-promo.webp", "image/webp");
    return cachedIllustrationDataUri;
  } catch {
    cachedIllustrationDataUri = null;
    return null;
  }
}
