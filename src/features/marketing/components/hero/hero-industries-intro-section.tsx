import type { Locale } from "@/lib/locale";

function getHeroIndustriesIntroCopy(locale: Locale) {
  return locale === "pl"
    ? {
        line1: "Niezależnie od branży.",
        line2Prefix: "Ten sam ",
        line2Highlight: "profesjonalny standard.",
        description:
          "Tysiące firm. Różne branże. Jeden sposób na perfekcyjne wyceny.",
      }
    : {
        line1: "Regardless of industry.",
        line2Prefix: "The same ",
        line2Highlight: "professional standard.",
        description:
          "Thousands of companies. Different industries. One way to deliver perfect estimates.",
      };
}

export function HeroIndustriesIntro({ locale }: { locale: Locale }) {
  const copy = getHeroIndustriesIntroCopy(locale);

  return (
    <div className="relative overflow-visible px-2 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-5 lg:pb-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 left-1/2 -z-10 h-[min(100vw,28rem)] w-[min(100vw,42rem)] -translate-x-1/2 translate-y-[50px] rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-400/18 sm:translate-y-0 sm:-bottom-52 sm:h-[32rem] sm:w-[48rem] lg:-bottom-64"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-36 -right-12 -z-10 h-56 w-56 translate-y-[50px] rounded-full bg-blue-500/25 blur-3xl dark:bg-blue-400/22 sm:translate-y-0 sm:-bottom-44 sm:-right-8 sm:h-72 sm:w-72 lg:-bottom-52"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 -z-10 h-48 w-48 translate-y-[50px] rounded-full bg-violet-500/10 blur-3xl sm:translate-y-0 sm:-bottom-32 sm:h-64 sm:w-64 lg:-bottom-40"
      />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2
          id="hero-industries-intro"
          className="text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] sm:text-4xl sm:leading-[1.08] lg:text-5xl lg:leading-[1.06]"
        >
          <span className="block text-foreground">{copy.line1}</span>
          <span className="block sm:whitespace-nowrap">
            <span className="text-foreground">{copy.line2Prefix}</span>
            <span className="text-primary">{copy.line2Highlight}</span>
          </span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-pretty text-sm leading-6 text-muted-foreground sm:mt-6 sm:max-w-none sm:whitespace-nowrap sm:text-[0.9375rem] sm:leading-7">
          {copy.description}
        </p>
      </div>
    </div>
  );
}
