import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import { resolvePageTitle } from "@/features/app/metadata/resolve-page-title";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { searchParamsToQueryString } from "@/lib/auth-cross-link";
import { isLocale, type Locale } from "@/lib/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale: Locale = await resolveRequestLocale(localeParam);
  const title = await resolvePageTitle({ locale, pathname: `/${locale}/sign-up` });
  return createAppMetadata({ title });
}

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const resolvedSearchParams = await searchParams;
  const queryString = searchParamsToQueryString(resolvedSearchParams);
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <AuthShell
      locale={locale}
      title={t("signUp.title")}
      subtitle={t("signUp.subtitle")}
      showTermsNotice={false}
    >
      <SignUpForm locale={locale} queryString={queryString} />
    </AuthShell>
  );
}

