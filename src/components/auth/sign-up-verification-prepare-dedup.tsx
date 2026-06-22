"use client";

import { useClerk } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { isClerkDevelopmentEmailLimitError } from "@/lib/clerk-api-error";

type SignUpResource = NonNullable<
  NonNullable<ReturnType<typeof useClerk>["client"]>["signUp"]
>;
type PrepareVerification = SignUpResource["prepareVerification"];

const inFlightPrepares = new Map<string, Promise<SignUpResource>>();

type SignUpVerificationErrorContextValue = {
  prepareError: string | null;
  reportPrepareError: (error: unknown) => void;
  clearPrepareError: () => void;
};

const SignUpVerificationErrorContext =
  createContext<SignUpVerificationErrorContextValue | null>(null);

function useSignUpVerificationErrorContext() {
  const context = useContext(SignUpVerificationErrorContext);
  if (!context) {
    throw new Error(
      "SignUpVerificationPrepareDedup must be used within SignUpVerificationErrorProvider",
    );
  }

  return context;
}

export function SignUpVerificationErrorProvider({
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
    <SignUpVerificationErrorContext.Provider
      value={{ prepareError, reportPrepareError, clearPrepareError }}
    >
      {children}
    </SignUpVerificationErrorContext.Provider>
  );
}

export function SignUpVerificationErrorBanner({
  className,
}: {
  className?: string;
}) {
  const { prepareError } = useSignUpVerificationErrorContext();

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

function devLog(message: string, detail?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (detail !== undefined) {
    console.log(`[sign-up] ${message}`, detail);
    return;
  }

  console.log(`[sign-up] ${message}`);
}

function wrapPrepareVerification(
  signUp: SignUpResource,
  original: PrepareVerification,
  reportPrepareError: (error: unknown) => void,
): PrepareVerification {
  return function dedupedPrepareVerification(...args: Parameters<PrepareVerification>) {
    const attemptId = signUp.id;
    if (!attemptId) {
      return original.apply(signUp, args).catch((error: unknown) => {
        reportPrepareError(error);
        throw error;
      });
    }

    const existing = inFlightPrepares.get(attemptId);
    if (existing) {
      devLog("coalescing duplicate prepareVerification call", { attemptId });
      return existing;
    }

    devLog("preparing email verification");
    const promise = original
      .apply(signUp, args)
      .then((resource) => {
        devLog("email verification prepared");
        return resource;
      })
      .catch((error: unknown) => {
        devLog("email verification prepare failed", error);
        reportPrepareError(error);
        throw error;
      })
      .finally(() => {
        inFlightPrepares.delete(attemptId);
      });

    inFlightPrepares.set(attemptId, promise);
    return promise;
  };
}

export function SignUpVerificationPrepareDedup() {
  const { client } = useClerk();
  const { reportPrepareError } = useSignUpVerificationErrorContext();

  useEffect(() => {
    if (!client) {
      return;
    }

    const signUp = client.signUp;
    const original = signUp.prepareVerification.bind(signUp);
    signUp.prepareVerification = wrapPrepareVerification(
      signUp,
      original,
      reportPrepareError,
    );

    return () => {
      signUp.prepareVerification = original;
      if (signUp.id) {
        inFlightPrepares.delete(signUp.id);
      }
    };
  }, [client, reportPrepareError]);

  return null;
}
