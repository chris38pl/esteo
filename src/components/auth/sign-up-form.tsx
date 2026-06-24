"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { SignUpContinue } from "@/components/auth/sign-up-continue";
import {
  SignUpVerificationErrorBanner,
  SignUpVerificationErrorProvider,
  SignUpVerificationPrepareDedup,
} from "@/components/auth/sign-up-verification-prepare-dedup";
import {
  LocalizedClerkFieldError,
  LocalizedClerkGlobalError,
} from "@/components/auth/localized-clerk-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authCrossLinkPath } from "@/lib/auth-cross-link";

function SignUpVerifyEmail() {
  const { isLoaded, signUp } = useSignUp();
  const email = signUp?.emailAddress;

  if (!isLoaded || !email) {
    return null;
  }

  return email;
}

export function SignUpForm({
  locale,
  queryString = "",
}: {
  locale: string;
  queryString?: string;
}) {
  const t = useTranslations("auth");
  const c = useTranslations("common");

  return (
    <SignUpVerificationErrorProvider
      emailLimitMessage={t("errors.emailLimitExceeded")}
    >
      <SignUp.Root
        routing="path"
        path={`/${locale}/sign-up`}
      >
        <SignUpVerificationPrepareDedup />
      <LocalizedClerkGlobalError className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" />
      <div id="clerk-captcha" />

      <SignUp.Step name="start">
        <div className="space-y-4">
          <Clerk.Field name="firstName" className="space-y-2">
            <Clerk.Label asChild>
              <Label>{t("fields.name")}</Label>
            </Clerk.Label>
            <Clerk.Input asChild type="text" required autoComplete="name">
              <Input
                placeholder={t("fields.namePlaceholder")}
                className="h-10 rounded-lg"
              />
            </Clerk.Input>
            <LocalizedClerkFieldError className="text-xs text-destructive" />
          </Clerk.Field>

          <Clerk.Field name="emailAddress" className="space-y-2">
            <Clerk.Label asChild>
              <Label>{t("fields.email")}</Label>
            </Clerk.Label>
            <Clerk.Input asChild type="email" required autoComplete="email">
              <Input
                placeholder={t("fields.emailPlaceholder")}
                className="h-10 rounded-lg"
              />
            </Clerk.Input>
            <LocalizedClerkFieldError className="text-xs text-destructive" />
          </Clerk.Field>

          <Clerk.Field name="password" className="space-y-2">
            <Clerk.Label asChild>
              <Label>{t("fields.password")}</Label>
            </Clerk.Label>
            <Clerk.Input asChild type="password" required autoComplete="new-password">
              <Input className="h-10 rounded-lg" />
            </Clerk.Input>
            <LocalizedClerkFieldError className="text-xs text-destructive" />
          </Clerk.Field>

          <SignUp.Action submit asChild>
            <Button type="submit" className="h-11 w-full">
              {t("signUp.submit")}
            </Button>
          </SignUp.Action>

          <div className="flex items-center gap-3 pt-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{c("or")}</span>
            <Separator className="flex-1" />
          </div>

          <Clerk.Connection name="google" asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 rounded-lg border-border/40 text-muted-foreground hover:text-foreground"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                className="size-4"
              >
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.2-.4-3.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.7 15.4 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.2 0 10-2 13.6-5.3l-6.3-5.2C29.3 35.7 26.8 36.9 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.7 16.2 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.1 3-3.4 5.4-6.3 6.9l.1.1 6.3 5.2C34.9 43 44 37.6 44 24c0-1.3-.1-2.2-.4-3.5z"
                />
              </svg>
              {t("signUp.google")}
            </Button>
          </Clerk.Connection>

          <Clerk.Connection name="apple" asChild>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 rounded-lg border-border/40 text-muted-foreground hover:text-foreground"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-4"
                fill="currentColor"
              >
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              {t("signUp.apple")}
            </Button>
          </Clerk.Connection>

          <p className="text-center text-xs text-muted-foreground">
            {t("signUp.haveAccount")}{" "}
            <Link
              href={authCrossLinkPath(locale, "sign-in", queryString)}
              className="font-medium text-primary hover:underline"
            >
              {t("signUp.signInLink")}
            </Link>
          </p>
        </div>
      </SignUp.Step>

      <SignUp.Step name="continue">
        <SignUpContinue />
      </SignUp.Step>

      <SignUp.Step name="verifications">
        <SignUp.Strategy name="email_code">
          <div className="space-y-4">
            <SignUpVerificationErrorBanner className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" />

            <p className="text-sm text-muted-foreground">
              {t("signUp.verifyEmailTitle")}{" "}
              <span className="font-medium text-foreground">
                <SignUpVerifyEmail />
              </span>
            </p>

            <Clerk.Field name="code" className="space-y-2">
              <Clerk.Label asChild>
                <Label>{t("fields.code")}</Label>
              </Clerk.Label>
              <Clerk.Input asChild required>
                <Input inputMode="numeric" autoComplete="one-time-code" />
              </Clerk.Input>
              <LocalizedClerkFieldError className="text-xs text-destructive" />
            </Clerk.Field>

            <SignUp.Action submit asChild>
              <Button type="submit" className="w-full">
                {t("signUp.verifySubmit")}
              </Button>
            </SignUp.Action>

            <SignUp.Action
              resend
              fallback={({ resendableAfter }) => (
                <p className="text-center text-xs text-muted-foreground">
                  {t("signUp.resendCodeWait", { seconds: resendableAfter })}
                </p>
              )}
              asChild
            >
              <button
                type="button"
                className="w-full text-center text-xs font-medium text-primary hover:underline disabled:opacity-50"
              >
                {t("signUp.resendCode")}
              </button>
            </SignUp.Action>
          </div>
        </SignUp.Strategy>
      </SignUp.Step>
    </SignUp.Root>
    </SignUpVerificationErrorProvider>
  );
}
