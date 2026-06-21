import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Lock, Rocket, Shield, TrafficCone, Zap } from "lucide-react";

import { HOME_LANDING_HERO_IMAGES } from "@/features/landing/lib/hero-images";
import { getServerTranslations } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function LandingBackgroundDecor() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[8%] top-[6%] hidden h-28 w-28 rounded-full bg-violet-500/10 blur-3xl lg:block dark:bg-violet-500/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[14%] top-[10%] hidden size-1.5 rounded-full bg-blue-300/80 shadow-[0_0_12px_2px_rgba(96,165,250,0.8)] lg:block dark:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[22%] top-[8%] hidden size-1 rounded-full bg-violet-300/70 shadow-[0_0_10px_1px_rgba(167,139,250,0.7)] lg:block dark:block"
      />
    </>
  );
}

function LandingLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 p-[2px]">
        <div className="relative size-full overflow-hidden rounded-full bg-background">
          <Image src="/logo.png" alt="" fill className="object-cover" priority />
        </div>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">Esteo</span>
    </div>
  );
}

function HeadlineArrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 96 64"
      fill="none"
      className="pointer-events-none absolute left-[88%] -top-8 hidden h-[3.5rem] w-[5.75rem] text-blue-500 sm:left-[90%] sm:-top-9 sm:h-16 sm:w-24 lg:block dark:text-violet-400"
    >
      <path
        d="M88 8 C76 0 58 2 50 12 C42 20 38 32 28 40 C22 45 14 46 10 40"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 36 L10 40 L14 48"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureItem({
  icon: Icon,
  label,
  iconClassName,
  mobileList = false,
}: {
  icon: typeof Rocket;
  label: string;
  iconClassName: string;
  mobileList?: boolean;
}) {
  if (mobileList) {
    return (
      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            iconClassName,
          )}
        >
          <Icon className="size-[1.125rem]" strokeWidth={2.2} />
        </div>
        <p className="text-sm text-foreground/90">{label}</p>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-row items-center gap-3 lg:gap-3.5">
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg shadow-sm lg:size-10",
          iconClassName,
        )}
      >
        <Icon className="size-4 lg:size-[1.125rem]" strokeWidth={2.2} />
      </div>
      <p className="max-w-[9.5rem] text-sm font-medium leading-snug text-foreground/90 lg:max-w-none lg:whitespace-nowrap">
        {label}
      </p>
    </div>
  );
}

function HeroImage() {
  return (
    <div className="relative z-0 -mt-2 mx-auto w-full max-w-xl overflow-hidden sm:-mt-3 lg:pointer-events-none lg:absolute lg:top-1/2 lg:left-[24%] lg:mx-0 lg:mt-0 lg:w-[88%] lg:max-w-none lg:overflow-visible lg:-translate-y-1/2 xl:left-[26%] xl:w-[86%]">
      <img
        src={HOME_LANDING_HERO_IMAGES.light}
        alt=""
        draggable={false}
        className="relative z-0 mx-auto w-[145%] max-w-none -translate-x-[38%] scale-[1.1] object-contain object-center dark:hidden lg:mx-0 lg:w-full lg:translate-x-0 lg:scale-[1.28] lg:object-contain xl:scale-[1.38]"
      />
      <img
        src={HOME_LANDING_HERO_IMAGES.dark}
        alt=""
        draggable={false}
        className="relative z-0 mx-auto hidden w-[145%] max-w-none -translate-x-[38%] scale-[1.1] object-contain object-center dark:block lg:mx-0 lg:w-full lg:translate-x-0 lg:scale-[1.28] lg:object-contain xl:scale-[1.38]"
      />
    </div>
  );
}

function CtaBanner({
  locale,
  signInLabel,
  dashboardLabel,
  title,
  description,
}: {
  locale: Locale;
  signInLabel: string;
  dashboardLabel: string;
  title: string;
  description: string;
}) {
  const buttonClassName =
    "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/15 transition hover:brightness-110 lg:w-auto lg:shadow-lg lg:shadow-blue-500/20";

  const lockIcon = (
    <div className="relative shrink-0">
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-lg dark:bg-blue-400/15 lg:bg-blue-500/20 lg:blur-xl lg:dark:bg-blue-400/25"
      />
      <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-violet-500/10 ring-1 ring-blue-500/20 lg:size-14 dark:from-blue-500/25 dark:to-violet-500/15 dark:ring-blue-400/30">
        <Lock className="size-5 text-blue-600 lg:size-6 dark:text-blue-400" strokeWidth={2} />
      </div>
    </div>
  );

  const ctaText = (
    <div className="min-w-0 flex-1 space-y-1 text-left">
      <h2 className="text-base font-semibold tracking-tight text-foreground lg:text-lg">{title}</h2>
      <p className="text-xs leading-relaxed text-muted-foreground lg:text-sm">{description}</p>
    </div>
  );

  const ctaButton = (href: string, label: string) => (
    <a href={href} className={buttonClassName}>
      <span className="lg:hidden">→ </span>
      {label}
      <ArrowRight className="hidden size-4 lg:block" />
    </a>
  );

  return (
    <section className="w-full rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm backdrop-blur-md lg:p-5 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_0_28px_-16px_rgba(59,130,246,0.25)] lg:dark:shadow-[0_0_40px_-12px_rgba(59,130,246,0.35)]">
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="flex items-start gap-4">
          {lockIcon}
          {ctaText}
        </div>
        <SignedOut>{ctaButton(`/${locale}/sign-in`, signInLabel)}</SignedOut>
        <SignedIn>{ctaButton(`/${locale}/dashboard`, dashboardLabel)}</SignedIn>
      </div>

      <div className="hidden items-center gap-5 lg:flex">
        {lockIcon}
        {ctaText}
        <SignedOut>{ctaButton(`/${locale}/sign-in`, signInLabel)}</SignedOut>
        <SignedIn>{ctaButton(`/${locale}/dashboard`, dashboardLabel)}</SignedIn>
      </div>
    </section>
  );
}

export async function HomeLandingPage({ locale }: { locale: Locale }) {
  const t = await getServerTranslations(locale, "landing");

  return (
    <main className="relative flex min-h-full flex-1 flex-col overflow-x-hidden bg-background font-sans text-foreground lg:min-h-[100dvh] lg:items-center lg:justify-center">
      <LandingBackgroundDecor />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-8 sm:px-8 sm:pt-10 lg:px-8 lg:py-8">
        <section className="relative grid items-start gap-3 overflow-visible sm:gap-4 lg:min-h-[min(520px,54vh)] lg:grid-cols-1 lg:gap-0">
          <div className="relative z-10 flex max-w-xl flex-col gap-6 sm:gap-7 lg:max-w-[44%] lg:overflow-visible lg:gap-7">
            <LandingLogo />

            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200 lg:py-1 sm:text-[10px]">
              <TrafficCone className="size-3 shrink-0 text-blue-600 dark:text-blue-400" />
              {t("badge")}
            </div>

            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                <span className="block">{t("headlinePrefix")}</span>
                <span className="relative inline-block pr-10 sm:pr-14 lg:pr-16">
                  <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-sky-400 dark:to-violet-400">
                    {t("headlineHighlight")}
                  </span>
                  <HeadlineArrow />
                </span>
              </h1>
              <p className="relative z-20 -mb-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:-mb-5 sm:text-lg lg:z-auto lg:mb-0">
                {t("description")}
              </p>
            </div>

            <div className="relative z-10 hidden gap-9 lg:flex lg:w-[128%] lg:max-w-none xl:w-[138%]">
              <FeatureItem
                icon={Rocket}
                label={t("features.modern")}
                iconClassName="bg-gradient-to-br from-violet-500/15 to-blue-500/10 text-violet-600 dark:from-violet-500/25 dark:to-blue-500/15 dark:text-violet-300"
              />
              <FeatureItem
                icon={Shield}
                label={t("features.security")}
                iconClassName="bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-blue-600 dark:from-blue-500/25 dark:to-indigo-500/15 dark:text-blue-300"
              />
              <FeatureItem
                icon={Zap}
                label={t("features.comingSoon")}
                iconClassName="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:from-emerald-500/20 dark:to-teal-500/15 dark:text-emerald-300"
              />
            </div>
          </div>

          <HeroImage />
        </section>

        <div className="relative z-10 mt-8 flex flex-col gap-4 pl-6 sm:pl-8 lg:hidden">
          <FeatureItem
            mobileList
            icon={Rocket}
            label={t("features.modern")}
            iconClassName="bg-gradient-to-br from-violet-500/15 to-blue-500/10 text-violet-600 dark:from-violet-500/25 dark:to-blue-500/15 dark:text-violet-300"
          />
          <FeatureItem
            mobileList
            icon={Shield}
            label={t("features.security")}
            iconClassName="bg-gradient-to-br from-blue-500/15 to-indigo-500/10 text-blue-600 dark:from-blue-500/25 dark:to-indigo-500/15 dark:text-blue-300"
          />
          <FeatureItem
            mobileList
            icon={Zap}
            label={t("features.comingSoon")}
            iconClassName="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:from-emerald-500/20 dark:to-teal-500/15 dark:text-emerald-300"
          />
        </div>

        <div className="relative z-10 mx-auto mt-10 flex w-full max-w-md flex-col items-center space-y-8 lg:mt-10 lg:max-w-xl">
          <CtaBanner
            locale={locale}
            title={t("cta.title")}
            description={t("cta.description")}
            signInLabel={t("cta.signIn")}
            dashboardLabel={t("cta.dashboard")}
          />

          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            {t("footerLine1")}
            <br />
            {t("footerLine2")}
          </p>
        </div>
      </div>
    </main>
  );
}
