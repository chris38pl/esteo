import type { ReactNode } from "react";

import type { Locale } from "@/lib/locale";
import {
  getMarketingFooterNavigation,
  getMarketingLegalNavigation,
} from "@/features/marketing/lib/navigation";
import { FooterLinkList } from "@/features/marketing/components/footer-link-list";
import { siteConfig } from "@/features/marketing/seo/site-config";

export function MarketingFooter({ locale }: { locale: Locale }) {
  const footerNavigation = getMarketingFooterNavigation(locale);
  const legalNavigation = getMarketingLegalNavigation(locale);

  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="text-base font-semibold tracking-tight text-foreground">{siteConfig.name}</p>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {locale === "pl"
              ? "AI-assisted estimating workspace dla firm uslugowych."
              : "AI-assisted estimating workspace for service companies."}
          </p>
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            {siteConfig.supportEmail}
          </a>
        </div>

        <FooterColumn title={locale === "pl" ? "Produkt" : "Product"}>
          <FooterLinkList items={footerNavigation} locale={locale} />
        </FooterColumn>
        <FooterColumn title={locale === "pl" ? "Centrum bezpieczeństwa" : "Security Center"}>
          <FooterLinkList items={legalNavigation} locale={locale} />
        </FooterColumn>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children}
    </div>
  );
}
