import type { Locale } from "@/lib/locale";

import enAuth from "@/messages/en/auth.json";
import enCommon from "@/messages/en/common.json";
import enDashboard from "@/messages/en/dashboard.json";
import enSidebar from "@/messages/en/sidebar.json";
import enStyleguide from "@/messages/en/styleguide.json";
import plAuth from "@/messages/pl/auth.json";
import plCommon from "@/messages/pl/common.json";
import plDashboard from "@/messages/pl/dashboard.json";
import plSidebar from "@/messages/pl/sidebar.json";
import plStyleguide from "@/messages/pl/styleguide.json";

export const namespaces = ["common", "auth", "dashboard", "sidebar", "styleguide"] as const;
export type Namespace = (typeof namespaces)[number];

type MessagesByNamespace = {
  common: typeof enCommon;
  auth: typeof enAuth;
  dashboard: typeof enDashboard;
  sidebar: typeof enSidebar;
  styleguide: typeof enStyleguide;
};

export type Messages = {
  [K in keyof MessagesByNamespace]: MessagesByNamespace[K];
};

function forLocale(locale: Locale): Messages {
  return locale === "pl"
    ? {
        common: plCommon,
        auth: plAuth,
        dashboard: plDashboard,
        sidebar: plSidebar,
        styleguide: plStyleguide,
      }
    : {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        sidebar: enSidebar,
        styleguide: enStyleguide,
      };
}

export function getMessagesForLocale(locale: Locale): Messages {
  return forLocale(locale);
}

