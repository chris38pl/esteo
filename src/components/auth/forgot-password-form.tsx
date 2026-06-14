"use client";

import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getClerkErrorMessage(error: unknown, fallback: string) {
  if (isClerkAPIResponseError(error)) {
    return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const c = useTranslations("common");
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isLoaded || !signIn) {
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setCodeSent(true);
    } catch (sendError) {
      setError(getClerkErrorMessage(sendError, t("forgotPassword.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isLoaded || !signIn) {
      return;
    }

    if (password !== confirmPassword) {
      setError(t("forgotPassword.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push(`/${locale}/dashboard`);
        return;
      }

      if (result.status === "needs_second_factor") {
        setError(t("forgotPassword.mfaRequired"));
        return;
      }

      setError(t("forgotPassword.error"));
    } catch (resetError) {
      setError(getClerkErrorMessage(resetError, t("forgotPassword.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!codeSent) {
    return (
      <form onSubmit={handleSendCode} className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">{t("forgotPassword.hint")}</p>

        <div className="space-y-2">
          <Label htmlFor="reset-email">{t("fields.email")}</Label>
          <Input
            id="reset-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("fields.emailPlaceholder")}
            className="h-10 rounded-lg"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || !isLoaded}
          className="h-11 w-full rounded-lg"
        >
          {t("forgotPassword.submit")}
        </Button>

        <Link href={`/${locale}/sign-in`}>
          <Button type="button" variant="ghost" className="w-full">
            {c("actions.back")}
          </Button>
        </Link>
      </form>
    );
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {t("forgotPassword.verifyTitle")}{" "}
        <span className="font-medium text-foreground">{email}</span>
      </p>

      <div className="space-y-2">
        <Label htmlFor="reset-code">{t("fields.code")}</Label>
        <Input
          id="reset-code"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="h-10 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password">{t("fields.password")}</Label>
        <Input
          id="reset-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 rounded-lg"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-confirm-password">{t("fields.confirmPassword")}</Label>
        <Input
          id="reset-confirm-password"
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="h-10 rounded-lg"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !isLoaded}
        className="h-11 w-full rounded-lg"
      >
        {t("forgotPassword.newPasswordSubmit")}
      </Button>

      <Link href={`/${locale}/sign-in`}>
        <Button type="button" variant="ghost" className="w-full">
          {c("actions.back")}
        </Button>
      </Link>
    </form>
  );
}
