import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AuthShell
      title="Załóż konto"
      subtitle="Utwórz konto, aby zacząć tworzyć wyceny"
    >
      <SignUpForm locale={locale} />
    </AuthShell>
  );
}

