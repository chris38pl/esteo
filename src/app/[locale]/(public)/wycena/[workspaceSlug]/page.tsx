import { Clock3, LockKeyhole, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EstimateRequestForm } from "@/features/estimate-requests/components/estimate-request-form";
import { getPublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

const benefits = [
  {
    key: "fast",
    icon: Sparkles,
    titleKey: "hero.benefits.fast.title",
    descriptionKey: "hero.benefits.fast.description",
  },
  {
    key: "noObligation",
    icon: ShieldCheck,
    titleKey: "hero.benefits.noObligation.title",
    descriptionKey: "hero.benefits.noObligation.description",
  },
  {
    key: "individual",
    icon: Clock3,
    titleKey: "hero.benefits.individual.title",
    descriptionKey: "hero.benefits.individual.description",
  },
  {
    key: "secure",
    icon: LockKeyhole,
    titleKey: "hero.benefits.secure.title",
    descriptionKey: "hero.benefits.secure.description",
  },
] as const;

export default async function PublicEstimateRequestPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";
  setRequestLocale(resolvedLocale);

  const pageData = await getPublicEstimateRequestPageData({
    workspaceSlug,
    locale: resolvedLocale,
  });

  if (!pageData) {
    notFound();
  }

  const t = await getTranslations({ locale: resolvedLocale, namespace: "estimateRequests" });

  return (
    <main className="min-h-dvh bg-[#070b17] text-white">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.16),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,#070b17_0%,#0b1222_55%,#070b17_100%)]" />
        <div className="absolute bottom-0 left-0 -z-10 h-2/3 w-1/2 bg-[radial-gradient(circle_at_35%_35%,rgba(251,146,60,0.18),transparent_18%),linear-gradient(180deg,transparent,rgba(15,23,42,0.96))]" />
        <div className="mx-auto grid min-h-dvh max-w-7xl gap-8 px-5 py-8 md:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14 lg:py-10">
          <section className="order-2 lg:order-1">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.35em] text-orange-400">
              {t("hero.eyebrow")}
            </p>
            <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">
              {t("hero.title")}
              <span className="text-orange-500">.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
              {t("hero.description", { workspaceName: pageData.workspace.name })}
            </p>

            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.key} className="flex gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-400">
                    <benefit.icon className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-white">{t(benefit.titleKey)}</h2>
                    <p className="mt-1 text-[11px] leading-4 text-slate-400">
                      {t(benefit.descriptionKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-72 hidden max-w-xs items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-black/40 backdrop-blur lg:flex">
              <div className="grid size-9 place-items-center rounded-full bg-orange-500/15 text-orange-400">
                <UsersRound className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{t("hero.badge.title")}</p>
                <p className="text-[10px] leading-4 text-slate-400">{t("hero.badge.description")}</p>
              </div>
            </div>
          </section>

          <section className="order-1 lg:order-2">
            <EstimateRequestForm locale={resolvedLocale} pageData={pageData} />
          </section>
        </div>
      </div>
    </main>
  );
}
