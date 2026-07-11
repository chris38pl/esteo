import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingCTA } from "@/features/marketing/components/cta";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { contactContent } from "@/features/marketing/content/contact-content";
import { buildLocalizedPath } from "@/features/marketing/lib/build-url";
import type { Locale } from "@/lib/locale";

export function ContactPageContent({ locale }: { locale: Locale }) {
  const content = contactContent[locale];

  return (
    <MarketingContainer size="narrow" className="space-y-10 py-14 sm:space-y-12 sm:py-20">
      <MarketingPageHeader
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />

      <div className="rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8">
        <p className="text-sm font-medium text-foreground">{content.emailLabel}</p>
        <a
          href={`mailto:${content.email}`}
          className="mt-2 block text-lg font-semibold text-primary transition hover:underline"
        >
          {content.email}
        </a>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{content.responseTime}</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm leading-6 text-muted-foreground">{content.faqHint}</p>
        <MarketingCTA href={buildLocalizedPath(locale, "/faq")} variant="outline">
          {content.faqCta}
        </MarketingCTA>
      </div>
    </MarketingContainer>
  );
}
