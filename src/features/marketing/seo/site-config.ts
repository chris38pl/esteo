import { defaultLocale, locales, type Locale } from "@/lib/locale";

export type MarketingRouteId =
  | "home"
  | "pricing"
  | "faq"
  | "contact"
  | "workflow-demo"
  | "security"
  | "status"
  | "legal"
  | "privacy"
  | "terms"
  | "cookies"
  | "ai"
  | "subprocessors";

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
  socials: {
    facebook: "",
    linkedin: "",
    youtube: "",
  },
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
      id: "workflow-demo",
      path: "/#workflow",
      implemented: true,
      includeInSitemap: false,
      nav: { footer: true },
      label: { pl: "Zobacz jak to działa", en: "See how it works" },
    },
    {
      id: "pricing",
      path: "/pricing",
      implemented: true,
      includeInSitemap: true,
      nav: { header: true, footer: true },
      label: { pl: "Cennik", en: "Pricing" },
    },
    {
      id: "faq",
      path: "/faq",
      implemented: true,
      includeInSitemap: true,
      nav: { header: true, footer: true },
      label: { pl: "FAQ", en: "FAQ" },
    },
    {
      id: "contact",
      path: "/contact",
      implemented: true,
      includeInSitemap: true,
      nav: { header: true, footer: true },
      label: { pl: "Kontakt", en: "Contact" },
    },
    {
      id: "security",
      path: "/security",
      implemented: true,
      includeInSitemap: true,
      nav: { footer: true, legal: true },
      label: { pl: "Bezpieczeństwo", en: "Security" },
    },
    {
      id: "status",
      path: "/status",
      implemented: true,
      includeInSitemap: true,
      nav: {},
      label: { pl: "Status systemu", en: "System status" },
    },
    {
      id: "legal",
      path: "/legal",
      implemented: true,
      includeInSitemap: false,
      nav: {},
      label: { pl: "Centrum bezpieczeństwa", en: "Security Center" },
    },
    {
      id: "privacy",
      path: "/legal/privacy",
      implemented: true,
      includeInSitemap: true,
      nav: { footer: true, legal: true },
      label: { pl: "Polityka prywatnosci", en: "Privacy Policy" },
    },
    {
      id: "cookies",
      path: "/legal/cookies",
      implemented: true,
      includeInSitemap: true,
      nav: { footer: true, legal: true },
      label: { pl: "Cookies", en: "Cookies" },
    },
    {
      id: "ai",
      path: "/legal/ai",
      implemented: true,
      includeInSitemap: true,
      nav: {},
      label: { pl: "AI i odpowiedzialnosc", en: "AI & Responsibility" },
    },
    {
      id: "terms",
      path: "/legal/terms",
      implemented: true,
      includeInSitemap: true,
      nav: { footer: true, legal: true },
      label: { pl: "Regulamin", en: "Terms" },
    },
    {
      id: "subprocessors",
      path: "/legal/subprocessors",
      implemented: true,
      includeInSitemap: true,
      nav: {},
      label: { pl: "Dostawcy uslug", en: "Service providers" },
    },
  ] satisfies MarketingRoute[],
} as const;

export type SiteConfig = typeof siteConfig;
