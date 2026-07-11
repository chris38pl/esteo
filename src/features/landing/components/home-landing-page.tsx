import { FaqTeaserSection } from "@/features/marketing/components/faq-section";
import { FeaturesSection } from "@/features/marketing/components/features-section";
import { FinalCtaSection } from "@/features/marketing/components/final-cta-section";
import { HeroSection } from "@/features/marketing/components/hero/hero-section";
import { LandingViewTracker } from "@/features/marketing/components/landing-view-tracker";
import { PricingSection } from "@/features/marketing/components/pricing-section";
import { ProblemSection } from "@/features/marketing/components/problem-section";
import { SecurityTrustSection } from "@/features/marketing/components/security-section";
import { OrganizationJsonLd } from "@/features/marketing/components/seo-json-ld";
import { WorkflowSection } from "@/features/marketing/components/workflow-section";
import type { Locale } from "@/lib/locale";

export function HomeLandingPage({ locale }: { locale: Locale }) {
  return (
    <>
      <OrganizationJsonLd />
      <LandingViewTracker locale={locale} />
      <HeroSection locale={locale} />
      <ProblemSection locale={locale} />
      <WorkflowSection locale={locale} />
      <FeaturesSection locale={locale} />
      <PricingSection locale={locale} />
      <FaqTeaserSection locale={locale} />
      <SecurityTrustSection locale={locale} />
      <FinalCtaSection locale={locale} />
    </>
  );
}
