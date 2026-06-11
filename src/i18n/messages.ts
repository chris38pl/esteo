import type { Locale } from "@/lib/locale";

import enAdmin from "@/messages/en/admin.json";
import enAuth from "@/messages/en/auth.json";
import enBilling from "@/messages/en/billing.json";
import enCommon from "@/messages/en/common.json";
import enDashboard from "@/messages/en/dashboard.json";
import enEstimateRequests from "@/messages/en/estimateRequests.json";
import enEstimates from "@/messages/en/estimates.json";
import enPayments from "@/messages/en/payments.json";
import enRequests from "@/messages/en/requests.json";
import enNavbar from "@/messages/en/navbar.json";
import enSidebar from "@/messages/en/sidebar.json";
import enStyleguide from "@/messages/en/styleguide.json";
import enWorkspaces from "@/messages/en/workspaces.json";
import plAdmin from "@/messages/pl/admin.json";
import plAuth from "@/messages/pl/auth.json";
import plBilling from "@/messages/pl/billing.json";
import plCommon from "@/messages/pl/common.json";
import plDashboard from "@/messages/pl/dashboard.json";
import plEstimateRequests from "@/messages/pl/estimateRequests.json";
import plEstimates from "@/messages/pl/estimates.json";
import plPayments from "@/messages/pl/payments.json";
import plRequests from "@/messages/pl/requests.json";
import plNavbar from "@/messages/pl/navbar.json";
import plSidebar from "@/messages/pl/sidebar.json";
import plStyleguide from "@/messages/pl/styleguide.json";
import plWorkspaces from "@/messages/pl/workspaces.json";

export const namespaces = [
  "common",
  "admin",
  "auth",
  "billing",
  "dashboard",
  "estimateRequests",
  "estimates",
  "payments",
  "requests",
  "sidebar",
  "styleguide",
  "workspaces",
] as const;

/** Top-level message namespaces plus known sub-namespace paths used in server components. */
export type Namespace =
  | (typeof namespaces)[number]
  | "admin.users"
  | "admin.workspaces"
  | "admin.industryFields"
  | "admin.estimateRequests"
  | "admin.pdfPreview"
  | "workspaces.invitations";

type MessagesByNamespace = {
  common: typeof enCommon;
  admin: typeof enAdmin;
  auth: typeof enAuth;
  billing: typeof enBilling;
  dashboard: typeof enDashboard;
  estimateRequests: typeof enEstimateRequests;
  estimates: typeof enEstimates;
  payments: typeof enPayments;
  requests: typeof enRequests;
  navbar: typeof enNavbar;
  sidebar: typeof enSidebar;
  styleguide: typeof enStyleguide;
  workspaces: typeof enWorkspaces;
};

export type Messages = {
  [K in keyof MessagesByNamespace]: MessagesByNamespace[K];
};

function forLocale(locale: Locale): Messages {
  return locale === "pl"
    ? {
        common: plCommon,
        admin: plAdmin,
        auth: plAuth,
        billing: plBilling,
        dashboard: plDashboard,
        estimateRequests: plEstimateRequests,
        estimates: plEstimates,
        payments: plPayments,
        requests: plRequests,
        navbar: plNavbar,
        sidebar: plSidebar,
        styleguide: plStyleguide,
        workspaces: plWorkspaces,
      }
    : {
        common: enCommon,
        admin: enAdmin,
        auth: enAuth,
        billing: enBilling,
        dashboard: enDashboard,
        estimateRequests: enEstimateRequests,
        estimates: enEstimates,
        payments: enPayments,
        requests: enRequests,
        navbar: enNavbar,
        sidebar: enSidebar,
        styleguide: enStyleguide,
        workspaces: enWorkspaces,
      };
}

export function getMessagesForLocale(locale: Locale): Messages {
  return forLocale(locale);
}

