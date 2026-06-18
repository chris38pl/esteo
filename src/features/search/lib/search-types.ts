import type { SearchEntityType, SearchIconType } from "@prisma/client";

export type SearchDocumentMetadata = {
  searchFields?: {
    title?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    streetAddress?: string;
    city?: string;
    postalCode?: string;
    requestNumber?: string;
    projectDescription?: string;
    fileName?: string;
  };
  estimateId?: string;
  requestId?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  status?: string;
};

export type SearchResultItem = {
  id: string;
  entityType: SearchEntityType;
  iconType: SearchIconType;
  title: string;
  subtitle?: string;
  url: string;
  matchedField?: string;
  workspaceSlugSnapshot?: string;
};

export type SearchWorkspaceResult = {
  estimates: SearchResultItem[];
  inquiries: SearchResultItem[];
  attachments: SearchResultItem[];
};

export type RecentDocumentItem = {
  id: string;
  entityType: SearchEntityType;
  iconType: SearchIconType;
  title: string;
  subtitle?: string;
  url: string;
  lastOpenedAt: string;
};
