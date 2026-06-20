import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SignInForm } from "@/components/auth/sign-in-form";
import { searchParamsToQueryString } from "@/lib/auth-cross-link";
import { isLocale } from "@/lib/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; "sign-in"?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, "sign-in": segments } = await params;
  if (!isLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const resolvedSearchParams = await searchParams;
  const queryString = searchParamsToQueryString(resolvedSearchParams);
  const t = await getTranslations({ locale, namespace: "auth" });
  const isForgotPassword = segments?.[0] === "forgot-password";

  if (isForgotPassword) {
    return (
      <AuthShell
        locale={locale}
        title={t("forgotPassword.title")}
        subtitle={t("forgotPassword.subtitle")}
      >
        <ForgotPasswordForm locale={locale} />
      </AuthShell>
    );
  }

  return (
    <AuthShell locale={locale} title={t("signIn.title")} subtitle={t("signIn.subtitle")}>
      <SignInForm locale={locale} queryString={queryString} />
    </AuthShell>
  );
}
