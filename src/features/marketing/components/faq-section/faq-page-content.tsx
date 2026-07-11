import { MarketingContainer } from "@/features/marketing/components/container";
import { FaqAccordion } from "@/features/marketing/components/faq-section/faq-accordion";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import { FaqJsonLd } from "@/features/marketing/components/seo-json-ld";
import { getFaqContent } from "@/features/marketing/content/faq-content";
import type { Locale } from "@/lib/locale";

export function FaqPageContent({ locale }: { locale: Locale }) {
  const content = getFaqContent(locale);

  return (
    <>
      <FaqJsonLd items={content.allItems} />
      <MarketingContainer size="narrow" className="space-y-10 py-14 sm:space-y-12 sm:py-20">
        <MarketingPageHeader
          eyebrow={content.eyebrow}
          title={`${content.titleBefore}${content.titleHighlight}`}
          description={content.description}
        />
        <FaqAccordion items={content.allItems} page="faq" locale={locale} />
      </MarketingContainer>
    </>
  );
}
