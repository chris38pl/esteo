import Link from "next/link";

import type { Locale } from "@/lib/locale";
import {
  getMarketingFooterNavigation,
  getMarketingLegalNavigation,
} from "@/features/marketing/lib/navigation";
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

        <FooterColumn title={locale === "pl" ? "Produkt" : "Product"} items={footerNavigation} />
        <FooterColumn title="Legal" items={legalNavigation} />
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: Array<{ id: string; href: string; label: string; implemented: boolean }>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="transition hover:text-foreground"
              aria-disabled={!item.implemented}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
