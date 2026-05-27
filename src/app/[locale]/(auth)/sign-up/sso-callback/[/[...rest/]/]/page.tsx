import { SignUp } from "@clerk/nextjs";

export default async function SignUpSsoCallback({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <SignUp
      routing="path"
      path={`/${locale}/sign-up`}
      afterSignInUrl={`/${locale}/dashboard`}
      afterSignUpUrl={`/${locale}/dashboard`}
    />
  );
}

