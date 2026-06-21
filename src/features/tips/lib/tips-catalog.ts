import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import {
  dashboardAccountBillingTabHref,
  dashboardReferralsHref,
  dashboardUpgradeHref,
} from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

export const TIP_CATEGORY_IDS = [
  "estimates",
  "documents",
  "clients",
  "billing",
  "workspace",
] as const;

export type TipCategoryId = (typeof TIP_CATEGORY_IDS)[number];

export const TIP_IDS = [
  "send_estimate",
  "logo_pdf",
  "form_website",
  "upgrade_plan",
  "customize_rules",
  "company_description",
  "workspace_transfer",
  "partner_program",
  "estimate_modes",
  "browse_invoices",
  "theme_switch",
  "invite_team",
] as const;

export type TipId = (typeof TIP_IDS)[number];

export type TipCatalogEntry = {
  id: TipId;
  categoryId: TipCategoryId;
};

export const TIPS_CATALOG: TipCatalogEntry[] = [
  { id: "send_estimate", categoryId: "estimates" },
  { id: "logo_pdf", categoryId: "documents" },
  { id: "form_website", categoryId: "clients" },
  { id: "upgrade_plan", categoryId: "billing" },
  { id: "customize_rules", categoryId: "estimates" },
  { id: "company_description", categoryId: "documents" },
  { id: "workspace_transfer", categoryId: "workspace" },
  { id: "partner_program", categoryId: "billing" },
  { id: "estimate_modes", categoryId: "estimates" },
  { id: "browse_invoices", categoryId: "billing" },
  { id: "theme_switch", categoryId: "workspace" },
  { id: "invite_team", categoryId: "workspace" },
];

/** Nine tips shown in the estimates-page banner carousel (3 slides × 3 cards). */
export const TIPS_BANNER_IDS: TipId[] = [
  "upgrade_plan",
  "customize_rules",
  "company_description",
  "workspace_transfer",
  "partner_program",
  "estimate_modes",
  "browse_invoices",
  "theme_switch",
  "invite_team",
];

export const TIPS_BANNER_CATALOG: TipCatalogEntry[] = TIPS_BANNER_IDS.map((id) => {
  const entry = TIPS_CATALOG.find((tip) => tip.id === id);
  if (!entry) {
    throw new Error(`Missing banner tip catalog entry for ${id}`);
  }
  return entry;
});

export const TIPS_CAROUSEL_SLIDE_SIZE = 3;

export function chunkTipsForCarousel<T>(items: T[], size = TIPS_CAROUSEL_SLIDE_SIZE): T[][] {
  const slides: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    slides.push(items.slice(index, index + size));
  }
  return slides;
}

export function getTipHref(id: TipId, locale: Locale, workspaceSlug: string): string {
  switch (id) {
    case "send_estimate":
      return `/${locale}/dashboard/${workspaceSlug}/estimates`;
    case "logo_pdf":
    case "company_description":
      return `/${locale}/dashboard/${workspaceSlug}/settings?tab=company`;
    case "form_website":
      return getPublicEstimateRequestPath(locale, workspaceSlug);
    case "upgrade_plan":
      return dashboardUpgradeHref(locale, workspaceSlug);
    case "customize_rules":
      return `/${locale}/dashboard/${workspaceSlug}/settings?tab=rules`;
    case "workspace_transfer":
      return `/${locale}/dashboard/${workspaceSlug}/settings#workspace-transfer`;
    case "partner_program":
      return dashboardReferralsHref(locale, workspaceSlug);
    case "estimate_modes":
      return `/${locale}/dashboard/${workspaceSlug}/estimates`;
    case "browse_invoices":
      return dashboardAccountBillingTabHref(locale);
    case "theme_switch":
      return `/${locale}/dashboard/${workspaceSlug}/settings?tab=general`;
    case "invite_team":
      return `/${locale}/dashboard/${workspaceSlug}/settings?tab=users`;
  }
}
