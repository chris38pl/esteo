import "server-only";

import sharp from "sharp";

import {
  MAX_IMAGE_WIDTH_PX,
  THUMBNAIL_MAX_DIMENSION_PX,
} from "@/features/attachments/lib/constants";
import type { AllowedAttachmentMimeType } from "@/features/attachments/lib/allowed-mime-types";

export type ProcessedImageOriginal = {
  originalBuffer: Buffer;
  mimeType: AllowedAttachmentMimeType;
  width: number;
  height: number;
  storedBytes: number;
};

export type GeneratedImageThumbnail = {
  thumbnailBuffer: Buffer;
  storedBytes: number;
};

function outputFormatForMime(mimeType: AllowedAttachmentMimeType): "jpeg" | "png" | "webp" {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpeg";
}

async function encodeImage(
  pipeline: sharp.Sharp,
  mimeType: AllowedAttachmentMimeType,
): Promise<Buffer> {
  const format = outputFormatForMime(mimeType);

  if (format === "jpeg") {
    return pipeline.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  }

  if (format === "webp") {
    return pipeline.webp({ quality: 82 }).toBuffer();
  }

  return pipeline.png({ compressionLevel: 8 }).toBuffer();
}

export async function processImageOriginal(
  buffer: Buffer,
  mimeType: AllowedAttachmentMimeType,
): Promise<ProcessedImageOriginal> {
  const metadata = await sharp(buffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  let originalPipeline = sharp(buffer);

  if (width > MAX_IMAGE_WIDTH_PX) {
    originalPipeline = originalPipeline.resize({
      width: MAX_IMAGE_WIDTH_PX,
      withoutEnlargement: true,
    });
  }

  const originalBuffer = await encodeImage(originalPipeline, mimeType);
  const finalMeta = await sharp(originalBuffer).metadata();

  return {
    originalBuffer,
    mimeType,
    width: finalMeta.width ?? width,
    height: finalMeta.height ?? height,
    storedBytes: originalBuffer.length,
  };
}

export async function generateImageThumbnail(
  buffer: Buffer,
  mimeType: AllowedAttachmentMimeType,
): Promise<GeneratedImageThumbnail> {
  const thumbnailBuffer = await encodeImage(
    sharp(buffer).resize({
      width: THUMBNAIL_MAX_DIMENSION_PX,
      height: THUMBNAIL_MAX_DIMENSION_PX,
      fit: "inside",
      withoutEnlargement: true,
    }),
    mimeType,
  );

  return {
    thumbnailBuffer,
    storedBytes: thumbnailBuffer.length,
  };
}

/** @deprecated Use processImageOriginal + async generateImageThumbnail */
export async function processImageBuffer(
  buffer: Buffer,
  mimeType: AllowedAttachmentMimeType,
) {
  const original = await processImageOriginal(buffer, mimeType);
  const thumbnail = await generateImageThumbnail(buffer, mimeType);

  return {
    originalBuffer: original.originalBuffer,
    thumbnailBuffer: thumbnail.thumbnailBuffer,
    mimeType: original.mimeType,
    width: original.width,
    height: original.height,
    storedBytes: original.storedBytes + thumbnail.storedBytes,
  };
}

export function processPdfBuffer(buffer: Buffer): { originalBuffer: Buffer; storedBytes: number } {
  return {
    originalBuffer: buffer,
    storedBytes: buffer.length,
  };
}

export function processDocxBuffer(buffer: Buffer): { originalBuffer: Buffer; storedBytes: number } {
  return {
    originalBuffer: buffer,
    storedBytes: buffer.length,
  };
}
