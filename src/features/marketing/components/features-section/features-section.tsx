import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingSection } from "@/features/marketing/components/section";
import { FeaturesCarousel } from "@/features/marketing/components/features-section/features-carousel";
import { getFeaturesContent } from "@/features/marketing/components/features-section/features-data";
import type { Locale } from "@/lib/locale";

export function FeaturesSection({ locale }: { locale: Locale }) {
  const content = getFeaturesContent(locale);

  return (
    <MarketingSection
      id="features"
      className="dark relative isolate overflow-x-clip border-t border-border/40 bg-background pt-20 pb-14 text-foreground sm:pt-28 sm:pb-20"
    >
      <MarketingContainer size="wide" className="relative z-[1]">
        <FeaturesCarousel content={content} />
      </MarketingContainer>
    </MarketingSection>
  );
}
