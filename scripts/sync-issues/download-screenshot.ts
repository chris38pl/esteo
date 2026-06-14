import { UTApi } from "uploadthing/server";

export async function downloadUploadThingFile(storageKey: string): Promise<Buffer> {
  const token = process.env.UPLOADTHING_TOKEN;

  if (!token) {
    throw new Error("UPLOADTHING_TOKEN is not configured.");
  }

  const utapi = new UTApi({ token });
  const signed = await utapi.generateSignedURL(storageKey, { expiresIn: 15 * 60 });
  const response = await fetch(signed.ufsUrl);

  if (!response.ok) {
    throw new Error(`Failed to download file (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
