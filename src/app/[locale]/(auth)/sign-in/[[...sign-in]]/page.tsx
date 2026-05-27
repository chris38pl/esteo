import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <AuthShell title={t("signIn.title")} subtitle={t("signIn.subtitle")}>
      <SignInForm locale={locale} />
    </AuthShell>
  );
}

