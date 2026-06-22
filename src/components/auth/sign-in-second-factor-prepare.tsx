"use client";

import { useSignIn } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { isClerkDevelopmentEmailLimitError } from "@/lib/clerk-api-error";

const RESEND_COOLDOWN_SECONDS = 60;

const inFlightAttemptIds = new Set<string>();

type SignInResource = NonNullable<ReturnType<typeof useSignIn>["signIn"]>;

type SignInSecondFactorContextValue = {
  prepareError: string | null;
  reportPrepareError: (error: unknown) => void;
  clearPrepareError: () => void;
};

const SignInSecondFactorContext =
  createContext<SignInSecondFactorContextValue | null>(null);

function useSignInSecondFactorContext() {
  const context = useContext(SignInSecondFactorContext);
  if (!context) {
    throw new Error(
      "SignInSecondFactor components must be used within SignInSecondFactorProvider",
    );
  }

  return context;
}

export function SignInSecondFactorProvider({
  emailLimitMessage,
  children,
}: {
  emailLimitMessage: string;
  children: ReactNode;
}) {
  const [prepareError, setPrepareError] = useState<string | null>(null);

  const reportPrepareError = useCallback(
    (error: unknown) => {
      if (isClerkDevelopmentEmailLimitError(error)) {
        setPrepareError(emailLimitMessage);
      }
    },
    [emailLimitMessage],
  );

  const clearPrepareError = useCallback(() => {
    setPrepareError(null);
  }, []);

  return (
    <SignInSecondFactorContext.Provider
      value={{ prepareError, reportPrepareError, clearPrepareError }}
    >
      {children}
    </SignInSecondFactorContext.Provider>
  );
}

export function SignInSecondFactorErrorBanner({
  className,
}: {
  className?: string;
}) {
  const { prepareError } = useSignInSecondFactorContext();

  if (!prepareError) {
    return null;
  }

  return (
    <p
      className={
        className ??
        "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      }
    >
      {prepareError}
    </p>
  );
}

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
  reportPrepareError: (error: unknown) => void,
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
    reportPrepareError(error);
    return false;
  } finally {
    inFlightAttemptIds.delete(attemptId);
  }
}

export function SignInSecondFactorPrepare() {
  const { isLoaded, signIn } = useSignIn();
  const { reportPrepareError, clearPrepareError } =
    useSignInSecondFactorContext();

  useEffect(() => {
    if (!isLoaded || !signIn) {
      return;
    }

    const attemptId = signIn.id;
    if (attemptId && signIn.status !== "needs_second_factor") {
      inFlightAttemptIds.delete(attemptId);
      clearPrepareError();
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

    void runAutoPrepare(signIn, emailFactor.emailAddressId, reportPrepareError);
  }, [
    isLoaded,
    signIn,
    signIn?.id,
    signIn?.status,
    reportPrepareError,
    clearPrepareError,
  ]);

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
  const { reportPrepareError } = useSignInSecondFactorContext();
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
      reportPrepareError(error);
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
