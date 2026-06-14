"use client";

import { useSignUp } from "@clerk/nextjs";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import { LocalizedClerkFieldError } from "@/components/auth/localized-clerk-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignUpContinue() {
  const t = useTranslations("auth");
  const { isLoaded, signUp } = useSignUp();
  const submitRef = useRef<HTMLButtonElement>(null);
  const attemptedRef = useRef(false);

  const missingFields = signUp?.missingFields ?? [];
  const needsFirstName = missingFields.includes("first_name");

  useEffect(() => {
    if (!isLoaded || !signUp || attemptedRef.current || needsFirstName) {
      return;
    }

    if (missingFields.length === 0) {
      attemptedRef.current = true;
      submitRef.current?.click();
    }
  }, [isLoaded, signUp, missingFields, needsFirstName]);

  if (needsFirstName) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("signUp.continueTitle")}</p>

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

        <SignUp.Action submit asChild>
          <Button type="submit" className="h-11 w-full rounded-lg">
            {t("signUp.continueSubmit")}
          </Button>
        </SignUp.Action>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("signUp.continueLoading")}</p>
      <SignUp.Action submit asChild>
        <button
          ref={submitRef}
          type="submit"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </SignUp.Action>
    </div>
  );
}
