export type RequestCustomerData = {
  fullName?: string;
  email?: string;
  phone?: string;
  project?: { preferredStartDate?: string };
};

export type RequestAddressData = {
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  voivodeship?: string;
};

export function parseRequestCustomerData(raw: unknown): RequestCustomerData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as RequestCustomerData;
}

export function parseRequestAddress(raw: unknown): RequestAddressData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return raw as RequestAddressData;
}

export function parseRequestAttachmentCount(raw: unknown): number {
  return Array.isArray(raw) ? raw.length : 0;
}
