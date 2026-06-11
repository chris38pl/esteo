import "server-only";

import { getStorageProvider } from "@/features/attachments/server/storage";

async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      return null;
    }

    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Inline workspace logo for Puppeteer HTML (external URLs often fail in setContent). */
export async function resolvePdfLogoDataUri(input: {
  logoUrl: string | null;
  logoStorageKey: string | null;
}): Promise<string | null> {
  if (input.logoUrl) {
    const fromUrl = await fetchImageAsDataUri(input.logoUrl);
    if (fromUrl) {
      return fromUrl;
    }
  }

  if (!input.logoStorageKey?.trim()) {
    return null;
  }

  try {
    const storage = getStorageProvider();
    const signedUrl = await storage.getSignedUrl(input.logoStorageKey, {
      expiresInSeconds: 15 * 60,
    });
    return await fetchImageAsDataUri(signedUrl);
  } catch {
    return null;
  }
}
