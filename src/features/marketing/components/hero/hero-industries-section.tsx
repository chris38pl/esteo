import {
  getHeroIndustries,
  getHeroIndustriesCopy,
} from "@/features/marketing/components/hero/hero-industries-data";
import { HeroIndustriesCarousel } from "@/features/marketing/components/hero/hero-industries-carousel";
import { HeroIndustriesIntro } from "@/features/marketing/components/hero/hero-industries-intro-section";
import type { Locale } from "@/lib/locale";

export function HeroIndustriesSection({ locale }: { locale: Locale }) {
  const industries = getHeroIndustries(locale);
  const copy = getHeroIndustriesCopy(locale);

  return (
    <section className="relative" aria-labelledby="hero-industries-intro">
      <HeroIndustriesIntro locale={locale} />

      <HeroIndustriesCarousel
        industries={industries}
        copy={{
          previous: copy.previous,
          next: copy.next,
        }}
      />
    </section>
  );
}
