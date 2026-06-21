import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import {
  dashboardAccountBillingTabHref,
  dashboardReferralsHref,
  dashboardUpgradeHref,
} from "@/lib/dashboard-routes";
import type { Locale } from "@/lib/locale";

export const TIP_CATEGORY_IDS = [
  "getting_started",
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
  "first_estimate_steps",
  "voice_create_estimate",
  "review_ai_before_send",
  "find_save_pdf",
  "client_sent_inquiry",
  "share_form_link",
  "preview_client_form",
  "fill_company_data",
  "edit_one_line",
  "ai_chat_plain_language",
  "payment_deposit",
  "track_overdue_payments",
  "quick_search",
  "pin_important_estimate",
  "client_photos",
  "undo_mistake",
  "what_is_workspace",
  "use_on_phone",
  "report_problem",
  "dashboard_numbers",
] as const;

export type TipId = (typeof TIP_IDS)[number];

export type TipCatalogEntry = {
  id: TipId;
  categoryId: TipCategoryId;
};

export const TIPS_CATALOG: TipCatalogEntry[] = [
  { id: "first_estimate_steps", categoryId: "getting_started" },
  { id: "voice_create_estimate", categoryId: "getting_started" },
  { id: "review_ai_before_send", categoryId: "getting_started" },
  { id: "undo_mistake", categoryId: "getting_started" },
  { id: "use_on_phone", categoryId: "getting_started" },
  { id: "dashboard_numbers", categoryId: "getting_started" },
  { id: "send_estimate", categoryId: "estimates" },
  { id: "customize_rules", categoryId: "estimates" },
  { id: "estimate_modes", categoryId: "estimates" },
  { id: "edit_one_line", categoryId: "estimates" },
  { id: "ai_chat_plain_language", categoryId: "estimates" },
  { id: "logo_pdf", categoryId: "documents" },
  { id: "company_description", categoryId: "documents" },
  { id: "find_save_pdf", categoryId: "documents" },
  { id: "fill_company_data", categoryId: "documents" },
  { id: "form_website", categoryId: "clients" },
  { id: "client_sent_inquiry", categoryId: "clients" },
  { id: "share_form_link", categoryId: "clients" },
  { id: "preview_client_form", categoryId: "clients" },
  { id: "client_photos", categoryId: "clients" },
  { id: "upgrade_plan", categoryId: "billing" },
  { id: "partner_program", categoryId: "billing" },
  { id: "browse_invoices", categoryId: "billing" },
  { id: "payment_deposit", categoryId: "billing" },
  { id: "track_overdue_payments", categoryId: "billing" },
  { id: "workspace_transfer", categoryId: "workspace" },
  { id: "theme_switch", categoryId: "workspace" },
  { id: "invite_team", categoryId: "workspace" },
  { id: "quick_search", categoryId: "workspace" },
  { id: "pin_important_estimate", categoryId: "workspace" },
  { id: "what_is_workspace", categoryId: "workspace" },
  { id: "report_problem", categoryId: "workspace" },
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

function dashboardEstimatesPath(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/estimates`;
}

function dashboardRequestsPath(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/requests`;
}

function dashboardPaymentsPath(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/payments`;
}

function dashboardOverviewPath(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}`;
}

function dashboardSettingsGeneralPath(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/settings?tab=general`;
}

function dashboardSettingsCompanyPath(locale: Locale, workspaceSlug: string) {
  return `/${locale}/dashboard/${workspaceSlug}/settings?tab=company`;
}

export function getTipHref(id: TipId, locale: Locale, workspaceSlug: string): string {
  switch (id) {
    case "send_estimate":
    case "first_estimate_steps":
    case "voice_create_estimate":
    case "review_ai_before_send":
    case "find_save_pdf":
    case "edit_one_line":
    case "ai_chat_plain_language":
    case "undo_mistake":
    case "use_on_phone":
    case "estimate_modes":
    case "pin_important_estimate":
      return dashboardEstimatesPath(locale, workspaceSlug);
    case "client_sent_inquiry":
    case "client_photos":
      return dashboardRequestsPath(locale, workspaceSlug);
    case "share_form_link":
    case "preview_client_form":
    case "form_website":
      return getPublicEstimateRequestPath(locale, workspaceSlug);
    case "logo_pdf":
    case "company_description":
    case "fill_company_data":
      return dashboardSettingsCompanyPath(locale, workspaceSlug);
    case "payment_deposit":
    case "track_overdue_payments":
      return dashboardPaymentsPath(locale, workspaceSlug);
    case "dashboard_numbers":
      return dashboardOverviewPath(locale, workspaceSlug);
    case "what_is_workspace":
    case "report_problem":
    case "theme_switch":
      return dashboardSettingsGeneralPath(locale, workspaceSlug);
    case "upgrade_plan":
      return dashboardUpgradeHref(locale, workspaceSlug);
    case "customize_rules":
      return `/${locale}/dashboard/${workspaceSlug}/settings?tab=rules`;
    case "workspace_transfer":
      return `/${locale}/dashboard/${workspaceSlug}/settings#workspace-transfer`;
    case "partner_program":
      return dashboardReferralsHref(locale, workspaceSlug);
    case "browse_invoices":
      return dashboardAccountBillingTabHref(locale);
    case "invite_team":
      return `/${locale}/dashboard/${workspaceSlug}/settings?tab=users`;
    case "quick_search":
      return dashboardEstimatesPath(locale, workspaceSlug);
  }
}
