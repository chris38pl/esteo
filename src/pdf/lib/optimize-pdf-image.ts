import sharp from "sharp";

export type PdfImageFormat = "jpeg" | "png" | "webp";

export type OptimizePdfImageInput = {
  maxWidth: number;
  maxHeight: number;
  format?: PdfImageFormat;
  quality?: number;
  /** When omitted, alpha channel in source selects PNG vs JPEG. */
  hasAlpha?: boolean;
};

export type OptimizedPdfImage = {
  buffer: Buffer;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

async function imageHasAlpha(buffer: Buffer): Promise<boolean> {
  const metadata = await sharp(buffer).metadata();
  return metadata.hasAlpha === true;
}

function mimeForFormat(format: PdfImageFormat): OptimizedPdfImage["mimeType"] {
  if (format === "png") {
    return "image/png";
  }

  if (format === "webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

async function encodePdfImage(
  pipeline: sharp.Sharp,
  format: PdfImageFormat,
  quality: number,
): Promise<Buffer> {
  if (format === "jpeg") {
    return pipeline
      .flatten({ background: "#ffffff" })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  if (format === "webp") {
    return pipeline.webp({ quality }).toBuffer();
  }

  return pipeline.png({ compressionLevel: 8 }).toBuffer();
}

/** Resize and re-encode images before inlining in Puppeteer HTML (avoids full-res PDF embeds). */
export async function optimizePdfImage(
  buffer: Buffer,
  input: OptimizePdfImageInput,
): Promise<OptimizedPdfImage> {
  const quality = input.quality ?? 82;
  const useAlpha =
    input.hasAlpha ?? (input.format === "png" ? true : await imageHasAlpha(buffer));
  const format: PdfImageFormat =
    input.format ?? (useAlpha ? "png" : "jpeg");

  const pipeline = sharp(buffer).resize({
    width: input.maxWidth,
    height: input.maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  const encoded = await encodePdfImage(pipeline, format, quality);

  return {
    buffer: encoded,
    mimeType: mimeForFormat(format),
  };
}

export function toPdfImageDataUri(image: OptimizedPdfImage): string {
  return `data:${image.mimeType};base64,${image.buffer.toString("base64")}`;
}
