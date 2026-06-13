import "server-only";

import { getStorageProvider } from "@/features/attachments/server/storage";
import {
  optimizePdfImage,
  toPdfImageDataUri,
} from "@/pdf/lib/optimize-pdf-image";
import { PDF_WORKSPACE_LOGO_TARGET } from "@/pdf/lib/pdf-image-targets";

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      return null;
    }

    return buffer;
  } catch {
    return null;
  }
}

/** Inline workspace logo for Puppeteer HTML (external URLs often fail in setContent). */
export async function resolvePdfLogoDataUri(input: {
  logoUrl: string | null;
  logoStorageKey: string | null;
}): Promise<string | null> {
  let buffer: Buffer | null = null;

  if (input.logoUrl) {
    buffer = await fetchImageBuffer(input.logoUrl);
  }

  if (!buffer && input.logoStorageKey?.trim()) {
    try {
      const storage = getStorageProvider();
      const signedUrl = await storage.getSignedUrl(input.logoStorageKey, {
        expiresInSeconds: 15 * 60,
      });
      buffer = await fetchImageBuffer(signedUrl);
    } catch {
      buffer = null;
    }
  }

  if (!buffer) {
    return null;
  }

  try {
    const optimized = await optimizePdfImage(buffer, PDF_WORKSPACE_LOGO_TARGET);
    return toPdfImageDataUri(optimized);
  } catch {
    return null;
  }
}
