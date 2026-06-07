export async function downloadAttachmentFromUrl(
  url: string,
  fileName: string,
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Download failed.");
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}
