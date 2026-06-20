import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { searchParamsToQueryString } from "@/lib/auth-cross-link";
import { isLocale } from "@/lib/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

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
    <AuthShell locale={locale} title={t("signUp.title")} subtitle={t("signUp.subtitle")}>
      <SignUpForm locale={locale} queryString={queryString} />
    </AuthShell>
  );
}

