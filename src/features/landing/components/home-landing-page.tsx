import { HeroSection } from "@/features/marketing/components/hero/hero-section";
import type { Locale } from "@/lib/locale";

export function HomeLandingPage({ locale }: { locale: Locale }) {
  return <HeroSection locale={locale} />;
}
