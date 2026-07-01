import { FeaturesSection } from "@/features/marketing/components/features-section";
import { HeroSection } from "@/features/marketing/components/hero/hero-section";
import { PricingSection } from "@/features/marketing/components/pricing-section";
import { ProblemSection } from "@/features/marketing/components/problem-section";
import { WorkflowSection } from "@/features/marketing/components/workflow-section";
import type { Locale } from "@/lib/locale";

export function HomeLandingPage({ locale }: { locale: Locale }) {
  return (
    <>
      <HeroSection locale={locale} />
      <ProblemSection locale={locale} />
      <WorkflowSection locale={locale} />
      <FeaturesSection locale={locale} />
      <PricingSection locale={locale} />
    </>
  );
}
