import type { SubscriptionPlan } from "@prisma/client";

import { calculateEstimate, calculateLineItem } from "@/features/estimates/lib/calculate-estimate";
import { buildWorkspaceCompanyProfileExport } from "@/features/workspaces/lib/company-profile-for-export";
import type { Locale } from "@/lib/locale";
import { buildPdfIssueDates } from "@/pdf/lib/format-pdf-dates";
import { formatPdfCurrency, formatPdfQuantity } from "@/pdf/lib/format-pdf-currency";

export type EstimatePdfLineItemView = {
  index: string;
  name: string;
  unit: string;
  quantity: string;
  unitPriceNet: string;
  netValue: string;
};

export type EstimatePdfSectionView = {
  index: number;
  title: string;
  sectionNet: string;
  items: EstimatePdfLineItemView[];
};

export type EstimatePdfViewModel = {
  locale: Locale;
  referenceNumber: string;
  issueDateFormatted: string;
  validUntilFormatted: string;
  validityDays: number;
  showWatermark: boolean;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  logoStorageKey: string | null;
  logoDataUri: string | null;
  workspaceName: string;
  provider: {
    name: string;
    address: string | null;
    taxId: string | null;
    email: string | null;
    phone: string | null;
  };
  client: {
    name: string | null;
    address: string | null;
    email: string | null;
    phone: string | null;
    propertySize: string | null;
  };
  investment: {
    propertyType: string | null;
    addressStreet: string | null;
    addressCityLine: string | null;
  };
  totals: {
    net: string;
    vat: string;
    gross: string;
    vatRateLabel: string;
  };
  leadTimeLabel: string;
  sections: EstimatePdfSectionView[];
  notes: string;
  footerContactParts: string[];
};

type CustomerData = {
  fullName?: string;
  email?: string;
  phone?: string;
};

type AddressData = {
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  voivodeship?: string;
};

function formatAddress(address: AddressData | null | undefined): string | null {
  if (!address) {
    return null;
  }

  const parts = [
    address.streetAddress,
    [address.postalCode, address.city].filter(Boolean).join(" "),
    address.voivodeship,
  ].filter((part) => part && part.trim().length > 0);

  return parts.length > 0 ? parts.join(", ") : null;
}

function formatInvestmentAddress(address: AddressData | null | undefined): {
  addressStreet: string | null;
  addressCityLine: string | null;
} {
  if (!address) {
    return { addressStreet: null, addressCityLine: null };
  }

  const street = address.streetAddress?.trim() || null;
  const cityLine = [address.postalCode, address.city]
    .filter((part) => part && part.trim().length > 0)
    .join(" ")
    .trim();

  return {
    addressStreet: street,
    addressCityLine: cityLine.length > 0 ? cityLine : null,
  };
}

function parseJsonRecord<T>(value: unknown): T | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as T;
}

function dominantVatRateLabel(items: Array<{ vatRate: number }>): string {
  if (items.length === 0) {
    return "23%";
  }

  const rateCounts = new Map<number, number>();

  for (const item of items) {
    rateCounts.set(item.vatRate, (rateCounts.get(item.vatRate) ?? 0) + 1);
  }

  let dominant = items[0]!.vatRate;
  let maxCount = 0;

  for (const [rate, count] of rateCounts) {
    if (count > maxCount) {
      dominant = rate;
      maxCount = count;
    }
  }

  return `${Math.round(dominant * 100)}%`;
}

export function buildEstimatePdfViewModel(input: {
  locale: Locale;
  currency: string;
  requestNumber: string | null;
  estimateId: string;
  customerData: unknown;
  requestAddress: unknown;
  propertyTypeLabel: string | null;
  floorArea: number | null;
  workspace: {
    name: string;
    settings: {
      companyAddress: string | null;
      companyTaxId: string | null;
      companyEmail: string | null;
      companyPhone: string | null;
      branding: unknown;
    } | null;
  };
  brandingPrimaryColor?: string | null;
  brandingAccentColor?: string | null;
  versionNumber: number;
  marginPercent: number;
  sections: Array<{
    title: string;
    sortOrder: number;
    lineItems: Array<{
      name: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      vatRate: number;
      sortOrder: number;
    }>;
  }>;
  userPlan: SubscriptionPlan;
  issueDate?: Date;
}): EstimatePdfViewModel {
  const locale = input.locale;
  const issueDates = buildPdfIssueDates(input.issueDate ?? new Date(), locale);
  const company = buildWorkspaceCompanyProfileExport(input.workspace);

  const customer = parseJsonRecord<CustomerData>(input.customerData);
  const address = parseJsonRecord<AddressData>(input.requestAddress);

  const flatItems = input.sections.flatMap((section) => section.lineItems);
  const calc = calculateEstimate(
    flatItems.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      vatRate: item.vatRate,
    })),
    input.marginPercent,
  );

  const sectionViews: EstimatePdfSectionView[] = input.sections.map((section, sectionIndex) => {
    let sectionNet = 0;
    const items: EstimatePdfLineItemView[] = section.lineItems.map((item, itemIndex) => {
      const line = calculateLineItem({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
      });
      sectionNet += line.netValue;

      return {
        index: `${sectionIndex + 1}.${itemIndex + 1}`,
        name: item.name,
        unit: item.unit,
        quantity: formatPdfQuantity(item.quantity, locale),
        unitPriceNet: formatPdfCurrency(item.unitPrice, input.currency, locale),
        netValue: formatPdfCurrency(line.netValue, input.currency, locale),
      };
    });

    return {
      index: sectionIndex + 1,
      title: section.title,
      sectionNet: formatPdfCurrency(sectionNet, input.currency, locale),
      items,
    };
  });

  const referenceNumber =
    input.requestNumber?.trim() || input.estimateId.slice(-8).toUpperCase();

  const footerParts = [
    company.name,
    company.address,
    company.taxId ? `NIP: ${company.taxId}` : null,
    company.email,
    company.phone,
  ].filter(Boolean);

  const notes =
    locale === "pl"
      ? "Wycena ma charakter orientacyjny i nie stanowi oferty handlowej w rozumieniu Kodeksu Cywilnego."
      : "This estimate is indicative and does not constitute a commercial offer within the meaning of the Civil Code.";

  return {
    locale,
    referenceNumber,
    issueDateFormatted: issueDates.issueDateFormatted,
    validUntilFormatted: issueDates.validUntilFormatted,
    validityDays: issueDates.validityDays,
    showWatermark: input.userPlan === "FREE",
    primaryColor: input.brandingPrimaryColor ?? "#2563eb",
    accentColor: input.brandingAccentColor ?? "#dbeafe",
    logoUrl: company.logoUrl,
    logoStorageKey: company.logoStorageKey,
    logoDataUri: null,
    workspaceName: input.workspace.name,
    provider: {
      name: company.name,
      address: company.address,
      taxId: company.taxId,
      email: company.email,
      phone: company.phone,
    },
    client: {
      name: customer?.fullName ?? null,
      address: formatAddress(address),
      email: customer?.email ?? null,
      phone: customer?.phone ?? null,
      propertySize:
        input.floorArea != null
          ? locale === "pl"
            ? `${formatPdfQuantity(input.floorArea, locale)} m²`
            : `${formatPdfQuantity(input.floorArea, locale)} m²`
          : null,
    },
    investment: {
      propertyType: input.propertyTypeLabel,
      ...formatInvestmentAddress(address),
    },
    totals: {
      net: formatPdfCurrency(calc.totalNet, input.currency, locale),
      vat: formatPdfCurrency(calc.totalVat, input.currency, locale),
      gross: formatPdfCurrency(calc.totalGross, input.currency, locale),
      vatRateLabel: dominantVatRateLabel(flatItems),
    },
    leadTimeLabel: locale === "pl" ? "do uzgodnienia" : "to be agreed",
    sections: sectionViews,
    notes,
    footerContactParts: footerParts as string[],
  };
}
