import type { SearchDocumentMetadata } from "./search-types";

export function buildSearchText(fields: SearchDocumentMetadata["searchFields"]): string {
  return [
    fields?.title,
    fields?.requestNumber,
    fields?.customerName,
    fields?.customerEmail,
    fields?.customerPhone,
    fields?.streetAddress,
    fields?.city,
    fields?.postalCode,
    fields?.projectDescription,
    fields?.fileName,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");
}
