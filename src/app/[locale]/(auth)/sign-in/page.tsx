import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AuthShell title="Witaj ponownie w Esteo!" subtitle="Zaloguj się, aby kontynuować">
      <SignInForm locale={locale} />
    </AuthShell>
  );
}

