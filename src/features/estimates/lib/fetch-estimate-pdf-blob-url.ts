export async function fetchEstimatePdfBlobUrl(
  signedUrl: string,
  fileName?: string,
): Promise<string> {
  const response = await fetch(signedUrl);

  if (!response.ok) {
    throw new Error(`Failed to load PDF (${response.status}).`);
  }

  const blob = await response.blob();
  const mimeType = blob.type || "application/pdf";

  if (fileName) {
    const namedFile = new File([blob], fileName, { type: mimeType });
    return URL.createObjectURL(namedFile);
  }

  return URL.createObjectURL(blob);
}

export function downloadEstimatePdfFile(blobUrl: string, fileName: string): void {
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function revokeEstimatePdfBlobUrl(blobUrl: string | null | undefined): void {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
}
