import type { ReactNode } from "react";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/lib/locale";
import { CookieConsentFooterAction } from "@/features/marketing/components/cookie-consent";
import { MarketingFooterBottomBar } from "@/features/marketing/components/marketing-footer-bottom-bar";
import { MarketingFooterSocialLinks } from "@/features/marketing/components/marketing-footer-social-links";
import { MarketingFooterStatusCard } from "@/features/marketing/components/marketing-footer-status-card";
import {
  getMarketingFooterNavigation,
  getMarketingLegalNavigation,
} from "@/features/marketing/lib/navigation";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import { FooterLinkList } from "@/features/marketing/components/footer-link-list";
import { siteConfig } from "@/features/marketing/seo/site-config";

const footerTagline: Record<Locale, string> = {
  pl: "Szybsze kosztorysy, lepsze decyzje, więcej wygranych projektów!",
  en: "Faster estimates, better decisions, more won projects!",
};

export function MarketingFooter({ locale }: { locale: Locale }) {
  const footerNavigation = getMarketingFooterNavigation(locale);
  const legalNavigation = getMarketingLegalNavigation(locale);

  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.2fr_0.9fr_1fr_1.1fr]">
        <div className="space-y-5">
          <Link href={buildLocalizedPath(locale)} className="inline-flex items-center gap-3.5">
            <span className="relative size-12 shrink-0 overflow-hidden rounded-full">
              <Image src="/logo.png" alt="" fill sizes="48px" className="object-cover" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              {siteConfig.name}
            </span>
          </Link>

          <p className="max-w-sm text-sm leading-6 text-muted-foreground">{footerTagline[locale]}</p>

          <MarketingFooterSocialLinks />
        </div>

        <FooterColumn title={locale === "pl" ? "Produkt" : "Product"}>
          <FooterLinkList items={footerNavigation} locale={locale} />
        </FooterColumn>
        <FooterColumn title={locale === "pl" ? "Centrum zaufania" : "Trust Center"}>
          <FooterLinkList items={legalNavigation} locale={locale}>
            <CookieConsentFooterAction locale={locale} />
          </FooterLinkList>
        </FooterColumn>

        <MarketingFooterStatusCard locale={locale} />
      </div>

      <Suspense fallback={null}>
        <MarketingFooterBottomBar locale={locale} />
      </Suspense>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</p>
      {children}
    </div>
  );
}
