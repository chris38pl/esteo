"use client";

import { EstimateRequestFormPanel } from "@/features/estimate-requests/components/estimate-request-form-panel";
import { useEstimateRequestFormState } from "@/features/estimate-requests/hooks/use-estimate-request-form-state";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { Locale } from "@/lib/locale";

export function EstimateRequestForm({
  locale,
  pageData,
}: {
  locale: Locale;
  pageData: PublicEstimateRequestPageData;
}) {
  const formState = useEstimateRequestFormState({ locale, pageData });

  return <EstimateRequestFormPanel locale={locale} pageData={pageData} formState={formState} />;
}
