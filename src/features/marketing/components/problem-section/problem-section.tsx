import { MarketingContainer } from "@/features/marketing/components/container";
import { MarketingSection } from "@/features/marketing/components/section";
import {
  ProblemFeatureGrid,
  ProblemHeadline,
  ProblemVisual,
} from "@/features/marketing/components/problem-section/problem-panels";
import { getProblemContent } from "@/features/marketing/components/problem-section/problem-data";
import type { Locale } from "@/lib/locale";

export function ProblemSection({ locale }: { locale: Locale }) {
  const content = getProblemContent(locale);

  return (
    <MarketingSection className="dark relative isolate overflow-x-clip border-t border-border/40 bg-background text-foreground">
      <MarketingContainer size="wide">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-stretch lg:gap-x-10 lg:gap-y-2 xl:gap-x-12">
          <ProblemHeadline
            content={content}
            className="order-1 lg:order-2 lg:col-start-2 lg:row-start-1 lg:pb-0 lg:pt-6"
          />

          <ProblemVisual
            content={content}
            className="order-2 lg:order-1 lg:col-start-1 lg:row-span-2 lg:row-start-1"
          />

          <ProblemFeatureGrid
            features={content.features}
            className="order-3 lg:order-3 lg:col-start-2 lg:row-start-2 lg:-mt-5 xl:-mt-6"
          />
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
