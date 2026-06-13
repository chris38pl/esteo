"use client";

import { useSignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const RESEND_COOLDOWN_SECONDS = 60;

const inFlightAttemptIds = new Set<string>();

type SignInResource = NonNullable<ReturnType<typeof useSignIn>["signIn"]>;

function getEmailCodeFactor(signIn: SignInResource) {
  return signIn.supportedSecondFactors?.find(
    (factor) => factor.strategy === "email_code" && "emailAddressId" in factor,
  );
}

function shouldAutoPrepare(signIn: SignInResource) {
  if (signIn.status !== "needs_second_factor") {
    return false;
  }

  if (!getEmailCodeFactor(signIn)) {
    return false;
  }

  const verification = signIn.secondFactorVerification;
  return !verification?.status;
}

function devLog(message: string, detail?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (detail !== undefined) {
    console.log(`[sign-in] ${message}`, detail);
    return;
  }

  console.log(`[sign-in] ${message}`);
}

async function runAutoPrepare(
  signIn: SignInResource,
  emailAddressId: string,
): Promise<boolean> {
  const attemptId = signIn.id;
  if (!attemptId) {
    return false;
  }

  if (inFlightAttemptIds.has(attemptId)) {
    return false;
  }

  inFlightAttemptIds.add(attemptId);

  try {
    devLog("preparing email second factor");
    await signIn.prepareSecondFactor({
      strategy: "email_code",
      emailAddressId,
    });
    devLog("email second factor prepared");
    return true;
  } catch (error) {
    devLog("email second factor failed", error);
    return false;
  } finally {
    inFlightAttemptIds.delete(attemptId);
  }
}

export function SignInSecondFactorPrepare() {
  const { isLoaded, signIn } = useSignIn();

  useEffect(() => {
    if (!isLoaded || !signIn) {
      return;
    }

    const attemptId = signIn.id;
    if (attemptId && signIn.status !== "needs_second_factor") {
      inFlightAttemptIds.delete(attemptId);
      return;
    }

    if (!shouldAutoPrepare(signIn)) {
      return;
    }

    const emailFactor = getEmailCodeFactor(signIn);
    if (
      !emailFactor ||
      !("emailAddressId" in emailFactor) ||
      !emailFactor.emailAddressId
    ) {
      return;
    }

    void runAutoPrepare(signIn, emailFactor.emailAddressId);
  }, [isLoaded, signIn, signIn?.id, signIn?.status]);

  return null;
}

export function SignInSecondFactorResend({
  resendLabel,
  resendWaitLabel,
}: {
  resendLabel: string;
  resendWaitLabel: (seconds: number) => string;
}) {
  const { isLoaded, signIn } = useSignIn();
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!isLoaded || !signIn || cooldown > 0 || isResending) {
      return;
    }

    const emailFactor = getEmailCodeFactor(signIn);
    if (
      !emailFactor ||
      !("emailAddressId" in emailFactor) ||
      !emailFactor.emailAddressId
    ) {
      return;
    }

    setIsResending(true);
    devLog("preparing email second factor");

    try {
      await signIn.prepareSecondFactor({
        strategy: "email_code",
        emailAddressId: emailFactor.emailAddressId,
      });
      devLog("email second factor prepared");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      devLog("email second factor failed", error);
    } finally {
      setIsResending(false);
    }
  };

  if (cooldown > 0) {
    return (
      <p className="text-center text-xs text-muted-foreground">
        {resendWaitLabel(cooldown)}
      </p>
    );
  }

  return (
    <button
      type="button"
      disabled={isResending}
      onClick={() => void handleResend()}
      className="w-full text-center text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      {resendLabel}
    </button>
  );
}
