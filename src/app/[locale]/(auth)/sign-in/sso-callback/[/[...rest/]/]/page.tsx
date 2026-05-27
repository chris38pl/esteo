import { SignIn } from "@clerk/nextjs";

export default async function SignInSsoCallback({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <SignIn
      routing="path"
      path={`/${locale}/sign-in`}
      afterSignInUrl={`/${locale}/dashboard`}
      afterSignUpUrl={`/${locale}/dashboard`}
    />
  );
}

