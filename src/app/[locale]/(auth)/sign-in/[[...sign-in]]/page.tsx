import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string; "sign-in"?: string[] }>;
}) {
  const { locale, "sign-in": segments } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth" });
  const isForgotPassword = segments?.[0] === "forgot-password";

  if (isForgotPassword) {
    return (
      <AuthShell
        title={t("forgotPassword.title")}
        subtitle={t("forgotPassword.subtitle")}
      >
        <ForgotPasswordForm locale={locale} />
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("signIn.title")} subtitle={t("signIn.subtitle")}>
      <SignInForm locale={locale} />
    </AuthShell>
  );
}
