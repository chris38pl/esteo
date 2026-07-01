import type { Locale } from "@/lib/locale";

import enActivation from "@/messages/en/activation.json";
import enAdmin from "@/messages/en/admin.json";
import enAuth from "@/messages/en/auth.json";
import enBilling from "@/messages/en/billing.json";
import enCustomerAcquisition from "@/messages/en/customerAcquisition.json";
import enCommon from "@/messages/en/common.json";
import enDashboard from "@/messages/en/dashboard.json";
import enEstimateRequests from "@/messages/en/estimateRequests.json";
import enOpsCases from "@/messages/en/ops-cases.json";
import enLanding from "@/messages/en/landing.json";
import enIssues from "@/messages/en/issues.json";
import enEstimates from "@/messages/en/estimates.json";
import enPayments from "@/messages/en/payments.json";
import enReferrals from "@/messages/en/referrals.json";
import enTips from "@/messages/en/tips.json";
import enRequests from "@/messages/en/requests.json";
import enSearch from "@/messages/en/search.json";
import enNavbar from "@/messages/en/navbar.json";
import enNotifications from "@/messages/en/notifications.json";
import enSidebar from "@/messages/en/sidebar.json";
import enStyleguide from "@/messages/en/styleguide.json";
import enVoiceIntake from "@/messages/en/voiceIntake.json";
import enWorkspaceAdminBrowser from "@/messages/en/workspaceAdminBrowser.json";
import enWorkspaces from "@/messages/en/workspaces.json";
import enWorkspaceUsage from "@/messages/en/workspaceUsage.json";
import plActivation from "@/messages/pl/activation.json";
import plAdmin from "@/messages/pl/admin.json";
import plAuth from "@/messages/pl/auth.json";
import plBilling from "@/messages/pl/billing.json";
import plCustomerAcquisition from "@/messages/pl/customerAcquisition.json";
import plCommon from "@/messages/pl/common.json";
import plDashboard from "@/messages/pl/dashboard.json";
import plEstimateRequests from "@/messages/pl/estimateRequests.json";
import plOpsCases from "@/messages/pl/ops-cases.json";
import plLanding from "@/messages/pl/landing.json";
import plIssues from "@/messages/pl/issues.json";
import plEstimates from "@/messages/pl/estimates.json";
import plPayments from "@/messages/pl/payments.json";
import plReferrals from "@/messages/pl/referrals.json";
import plTips from "@/messages/pl/tips.json";
import plRequests from "@/messages/pl/requests.json";
import plSearch from "@/messages/pl/search.json";
import plNavbar from "@/messages/pl/navbar.json";
import plNotifications from "@/messages/pl/notifications.json";
import plSidebar from "@/messages/pl/sidebar.json";
import plStyleguide from "@/messages/pl/styleguide.json";
import plVoiceIntake from "@/messages/pl/voiceIntake.json";
import plWorkspaceAdminBrowser from "@/messages/pl/workspaceAdminBrowser.json";
import plWorkspaces from "@/messages/pl/workspaces.json";
import plWorkspaceUsage from "@/messages/pl/workspaceUsage.json";

export const namespaces = [
  "activation",
  "common",
  "admin",
  "auth",
  "billing",
  "customerAcquisition",
  "dashboard",
  "estimateRequests",
  "estimates",
  "issues",
  "landing",
  "ops-cases",
  "payments",
  "requests",
  "referrals",
  "tips",
  "notifications",
  "search",
  "sidebar",
  "styleguide",
  "voiceIntake",
  "workspaceAdminBrowser",
  "workspaceUsage",
  "workspaces",
] as const;

/** Top-level message namespaces plus known sub-namespace paths used in server components. */
export type Namespace =
  | (typeof namespaces)[number]
  | "admin.users"
  | "admin.workspaces"
  | "admin.industryFields"
  | "admin.estimateRequests"
  | "admin.estimates"
  | "admin.pdfPreview"
  | "admin.voiceIntakePreview"
  | "admin.activationPreview"
  | "workspaces.invitations";

type MessagesByNamespace = {
  activation: typeof enActivation;
  common: typeof enCommon;
  admin: typeof enAdmin;
  auth: typeof enAuth;
  billing: typeof enBilling;
  customerAcquisition: typeof enCustomerAcquisition;
  dashboard: typeof enDashboard;
  estimateRequests: typeof enEstimateRequests;
  estimates: typeof enEstimates;
  issues: typeof enIssues;
  landing: typeof enLanding;
  "ops-cases": typeof enOpsCases;
  payments: typeof enPayments;
  requests: typeof enRequests;
  referrals: typeof enReferrals;
  tips: typeof enTips;
  notifications: typeof enNotifications;
  search: typeof enSearch;
  navbar: typeof enNavbar;
  sidebar: typeof enSidebar;
  styleguide: typeof enStyleguide;
  voiceIntake: typeof enVoiceIntake;
  workspaceAdminBrowser: typeof enWorkspaceAdminBrowser;
  workspaceUsage: typeof enWorkspaceUsage;
  workspaces: typeof enWorkspaces;
};

export type Messages = {
  [K in keyof MessagesByNamespace]: MessagesByNamespace[K];
};

function forLocale(locale: Locale): Messages {
  return locale === "pl"
    ? {
        activation: plActivation,
        common: plCommon,
        admin: plAdmin,
        auth: plAuth,
        billing: plBilling,
        customerAcquisition: plCustomerAcquisition,
        dashboard: plDashboard,
        estimateRequests: plEstimateRequests,
        estimates: plEstimates,
        issues: plIssues,
        landing: plLanding,
        "ops-cases": plOpsCases,
        payments: plPayments,
        requests: plRequests,
        referrals: plReferrals,
        tips: plTips,
        notifications: plNotifications,
        search: plSearch,
        navbar: plNavbar,
        sidebar: plSidebar,
        styleguide: plStyleguide,
        voiceIntake: plVoiceIntake,
        workspaceAdminBrowser: plWorkspaceAdminBrowser,
        workspaceUsage: plWorkspaceUsage,
        workspaces: plWorkspaces,
      }
    : {
        activation: enActivation,
        common: enCommon,
        admin: enAdmin,
        auth: enAuth,
        billing: enBilling,
        customerAcquisition: enCustomerAcquisition,
        dashboard: enDashboard,
        estimateRequests: enEstimateRequests,
        estimates: enEstimates,
        issues: enIssues,
        landing: enLanding,
        "ops-cases": enOpsCases,
        payments: enPayments,
        requests: enRequests,
        referrals: enReferrals,
        tips: enTips,
        notifications: enNotifications,
        search: enSearch,
        navbar: enNavbar,
        sidebar: enSidebar,
        styleguide: enStyleguide,
        voiceIntake: enVoiceIntake,
        workspaceAdminBrowser: enWorkspaceAdminBrowser,
        workspaceUsage: enWorkspaceUsage,
        workspaces: enWorkspaces,
      };
}

export function getMessagesForLocale(locale: Locale): Messages {
  return forLocale(locale);
}

