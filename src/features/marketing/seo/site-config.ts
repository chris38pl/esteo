import { defaultLocale, locales, type Locale } from "@/lib/locale";

export type MarketingRouteId =
  | "home"
  | "pricing"
  | "faq"
  | "contact"
  | "security"
  | "legal"
  | "privacy"
  | "terms"
  | "cookies"
  | "ai";

export type MarketingRoute = {
  id: MarketingRouteId;
  path: string;
  implemented: boolean;
  includeInSitemap: boolean;
  nav: {
    header?: boolean;
    footer?: boolean;
    legal?: boolean;
  };
  label: Record<Locale, string>;
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://esteo.app").replace(/\/$/, "");

export const siteConfig = {
  name: "Esteo",
  url: siteUrl,
  companyName: "Esteo",
  supportEmail: "support@esteo.app",
  socials: {},
  locales: [...locales],
  defaultLocale,
  description: "AI-assisted estimating workspace for service companies.",
  ogImage: "/images/marketing/og/default-og.png",
  launchRoutes: [
    {
      id: "home",
      path: "/",
      implemented: true,
      includeInSitemap: true,
      nav: { header: false, footer: false },
      label: { pl: "Start", en: "Home" },
    },
    {
      id: "pricing",
      path: "/pricing",
      implemented: false,
      includeInSitemap: false,
      nav: { header: true, footer: true },
      label: { pl: "Cennik", en: "Pricing" },
    },
    {
      id: "faq",
      path: "/faq",
      implemented: false,
      includeInSitemap: false,
      nav: { header: true, footer: true },
      label: { pl: "FAQ", en: "FAQ" },
    },
    {
      id: "contact",
      path: "/contact",
      implemented: false,
      includeInSitemap: false,
      nav: { header: true, footer: true },
      label: { pl: "Kontakt", en: "Contact" },
    },
    {
      id: "security",
      path: "/security",
      implemented: false,
      includeInSitemap: false,
      nav: { header: false, footer: true },
      label: { pl: "Bezpieczenstwo", en: "Security" },
    },
    {
      id: "legal",
      path: "/legal",
      implemented: false,
      includeInSitemap: false,
      nav: { footer: true, legal: true },
      label: { pl: "Legal", en: "Legal" },
    },
    {
      id: "privacy",
      path: "/legal/privacy",
      implemented: false,
      includeInSitemap: false,
      nav: { footer: true, legal: true },
      label: { pl: "Prywatnosc", en: "Privacy" },
    },
    {
      id: "terms",
      path: "/legal/terms",
      implemented: false,
      includeInSitemap: false,
      nav: { footer: true, legal: true },
      label: { pl: "Regulamin", en: "Terms" },
    },
    {
      id: "cookies",
      path: "/legal/cookies",
      implemented: false,
      includeInSitemap: false,
      nav: { footer: true, legal: true },
      label: { pl: "Cookies", en: "Cookies" },
    },
    {
      id: "ai",
      path: "/legal/ai",
      implemented: false,
      includeInSitemap: false,
      nav: { footer: true, legal: true },
      label: { pl: "AI", en: "AI" },
    },
  ] satisfies MarketingRoute[],
} as const;

export type SiteConfig = typeof siteConfig;
