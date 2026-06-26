"use client";

import { Clock3, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

import { EstimateRequestFormPanel } from "@/features/estimate-requests/components/estimate-request-form-panel";
import { useEstimateRequestFormState } from "@/features/estimate-requests/hooks/use-estimate-request-form-state";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import { VoiceIntakeController } from "@/features/voice-intake/components/voice-intake-controller";
import { VoiceIntakeFooterBar } from "@/features/voice-intake/components/voice-intake-footer-bar";
import type { Locale } from "@/lib/locale";

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

export function PublicEstimateRequestClient({
  locale,
  pageData,
  canAccessWorkspace = false,
}: {
  locale: Locale;
  pageData: PublicEstimateRequestPageData;
  canAccessWorkspace?: boolean;
}) {
  const t = useTranslations("estimateRequests");
  const formState = useEstimateRequestFormState({ locale, pageData });

  return (
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

        <div className="mt-8 w-full lg:mt-72">
          <VoiceIntakeController
            locale={locale}
            industry={pageData.workspace.industry}
            industryOtherText={pageData.workspace.industryOtherText}
            fields={pageData.fields}
            endpoint={`/api/public/voice-intake?locale=${locale}`}
            workspaceSlug={pageData.workspace.slug}
            disabled={formState.isSubmitting}
            setters={formState.voiceSetters}
            onMetadataReady={formState.voiceCallbacks.onMetadataReady}
            onAppliedValuesReady={formState.voiceCallbacks.onAppliedValuesReady}
            renderTrigger={({ onClick, disabled }) => (
              <VoiceIntakeFooterBar
                floating
                onClick={onClick}
                disabled={disabled}
                industry={pageData.workspace.industry}
              />
            )}
          />
        </div>
      </section>

      <section className="min-w-0 w-full">
        <EstimateRequestFormPanel
          locale={locale}
          pageData={pageData}
          formState={formState}
          redirectToEstimateOnSuccess={canAccessWorkspace}
        />
      </section>
    </div>
  );
}
