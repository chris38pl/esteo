import { ensurePdfEsteoPromoAssetsReady } from "@/pdf/lib/pdf-esteo-promo-assets";
import { ensurePdfHeroImageReady } from "@/pdf/lib/pdf-hero-image";
import { ensurePdfInterFontFaceReady } from "@/pdf/lib/pdf-inter-font-face";

/** Load resized images and bundled fonts before building PDF HTML. */
export async function ensurePdfTemplateAssetsReady(): Promise<void> {
  await Promise.all([
    ensurePdfHeroImageReady(),
    ensurePdfEsteoPromoAssetsReady(),
    ensurePdfInterFontFaceReady(),
  ]);
}
