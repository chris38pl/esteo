import type { SearchDocumentMetadata } from "./search-types";

const FIELD_PRIORITY: Array<{
  key: keyof NonNullable<SearchDocumentMetadata["searchFields"]>;
  i18nKey: string;
}> = [
  { key: "title", i18nKey: "fields.title" },
  { key: "customerName", i18nKey: "fields.customerName" },
  { key: "customerEmail", i18nKey: "fields.customerEmail" },
  { key: "customerPhone", i18nKey: "fields.customerPhone" },
  { key: "streetAddress", i18nKey: "fields.address" },
  { key: "city", i18nKey: "fields.address" },
  { key: "postalCode", i18nKey: "fields.address" },
  { key: "requestNumber", i18nKey: "fields.requestNumber" },
  { key: "projectDescription", i18nKey: "fields.projectDescription" },
  { key: "fileName", i18nKey: "fields.fileName" },
];

export function resolveMatchedField(
  query: string,
  metadata: SearchDocumentMetadata | null | undefined,
  title: string,
): string | undefined {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return undefined;
  }

  const fields = metadata?.searchFields ?? {};

  if (title.toLowerCase().includes(normalizedQuery)) {
    return "fields.title";
  }

  for (const { key, i18nKey } of FIELD_PRIORITY) {
    if (key === "title") {
      continue;
    }
    const value = fields[key];
    if (value && value.toLowerCase().includes(normalizedQuery)) {
      return i18nKey;
    }
  }

  return undefined;
}
