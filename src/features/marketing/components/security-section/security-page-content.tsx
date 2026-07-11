import Link from "next/link";

import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { getSecurityPageContent } from "@/features/marketing/content/security-content";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";

export function SecurityPageContent({ locale }: { locale: Locale }) {
  const content = getSecurityPageContent(locale);

  return (
    <MarketingContainer size="narrow" className="space-y-10 py-14 sm:space-y-12 sm:py-20">
      <MarketingPageHeader
        eyebrow={content.eyebrow}
        title={content.pageTitle}
        description={content.pageDescription}
      />

      <div className="space-y-8">
        {content.sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
            <p className="text-sm leading-7 text-muted-foreground sm:text-[0.9375rem]">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border/60 pt-8 text-sm">
        <Link
          href={buildLocalizedPath(locale, "/legal/privacy")}
          className="text-muted-foreground transition hover:text-foreground"
        >
          {content.privacyLink}
        </Link>
        <Link
          href={buildLocalizedPath(locale, "/legal/cookies")}
          className="text-muted-foreground transition hover:text-foreground"
        >
          Cookies
        </Link>
        <Link
          href={buildLocalizedPath(locale, "/legal/ai")}
          className="text-muted-foreground transition hover:text-foreground"
        >
          {content.aiLink}
        </Link>
      </div>
    </MarketingContainer>
  );
}
