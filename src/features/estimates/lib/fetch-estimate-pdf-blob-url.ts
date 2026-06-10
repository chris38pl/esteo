export async function fetchEstimatePdfBlobUrl(signedUrl: string): Promise<string> {
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to load PDF (${response.status}).`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export function revokeEstimatePdfBlobUrl(blobUrl: string | null | undefined): void {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
}
