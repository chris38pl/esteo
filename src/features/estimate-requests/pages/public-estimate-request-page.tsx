import type { Metadata } from "next";
import { Clock3, LockKeyhole, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EstimateRequestForm } from "@/features/estimate-requests/components/estimate-request-form";
import { PublicEstimateHeader } from "@/features/estimate-requests/components/public-estimate-header";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import { getPublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import { viewerHasWorkspaceAccess } from "@/features/workspaces/server/workspace-access";
import { toCurrentUserProfile } from "@/lib/avatars/user-avatar-presets";
import { DatabaseUnavailableError } from "@/lib/database/database-unavailable-error";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { getCurrentUser } from "@/server/auth/get-current-user";

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

type PageParams = Promise<{ locale: string; workspaceSlug: string }>;

function resolveLocale(localeParam: string): Locale {
  return isLocale(localeParam) ? localeParam : "pl";
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale = resolveLocale(locale);

  const canonical = getPublicEstimateRequestPath(resolvedLocale, workspaceSlug);
  const languages: Record<string, string> = {
    pl: getPublicEstimateRequestPath("pl", workspaceSlug),
    en: getPublicEstimateRequestPath("en", workspaceSlug),
  };

  return {
    alternates: {
      canonical,
      languages,
    },
  };
}

export default async function PublicEstimateRequestPage({ params }: { params: PageParams }) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale = resolveLocale(locale);
  setRequestLocale(resolvedLocale);

  const pageData = await getPublicEstimateRequestPageData({
    workspaceSlug,
    locale: resolvedLocale,
  });

  if (!pageData) {
    notFound();
  }

  const t = await getTranslations({ locale: resolvedLocale, namespace: "estimateRequests" });

  let memberHeader: { backHref: string; currentUser: ReturnType<typeof toCurrentUserProfile> } | null =
    null;

  try {
    const user = await getCurrentUser();
    if (user && (await viewerHasWorkspaceAccess(user.id, pageData.workspace.id))) {
      memberHeader = {
        backHref: `/${resolvedLocale}/dashboard/${pageData.workspace.slug}/estimates`,
        currentUser: toCurrentUserProfile(user),
      };
    }
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) {
      throw error;
    }
  }

  return (
    <main className="min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      {memberHeader ? (
        <PublicEstimateHeader
          backHref={memberHeader.backHref}
          currentUser={memberHeader.currentUser}
        />
      ) : null}
      <div className="relative isolate overflow-x-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/estimate-request/estimate-request-light.webp"
            alt=""
            fill
            priority
            className="object-cover object-left-top dark:hidden"
          />
          <Image
            src="/images/estimate-request/estimate-request-dark.webp"
            alt=""
            fill
            priority
            className="hidden object-cover object-left-top dark:block"
          />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.14),transparent_45%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_45%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/55 to-background/95" />
        </div>

        <div className="mx-auto grid min-h-dvh w-full min-w-0 max-w-7xl gap-8 px-4 py-8 sm:px-5 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:py-10">
          <section>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.35em] text-primary">
              {t("hero.eyebrow")}
            </p>
            <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-tight text-foreground md:text-6xl">
              {t("hero.title")}
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">
              {t("hero.description", { workspaceName: pageData.workspace.name })}
            </p>

            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit.key} className="flex gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
                    <benefit.icon className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-foreground">{t(benefit.titleKey)}</h2>
                    <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                      {t(benefit.descriptionKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-72 hidden max-w-xs items-center gap-3 rounded-2xl border bg-card/75 p-4 shadow-xl shadow-black/5 backdrop-blur-md lg:flex dark:bg-card/55 dark:shadow-black/35">
              <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                <UsersRound className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{t("hero.badge.title")}</p>
                <p className="text-[10px] leading-4 text-muted-foreground">{t("hero.badge.description")}</p>
              </div>
            </div>
          </section>

          <section className="min-w-0 w-full">
            <EstimateRequestForm locale={resolvedLocale} pageData={pageData} />
          </section>
        </div>
      </div>
    </main>
  );
}

