"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

type SignUpResource = NonNullable<
  NonNullable<ReturnType<typeof useClerk>["client"]>["signUp"]
>;
type PrepareVerification = SignUpResource["prepareVerification"];

const inFlightPrepares = new Map<string, Promise<SignUpResource>>();

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
): PrepareVerification {
  return function dedupedPrepareVerification(...args: Parameters<PrepareVerification>) {
    const attemptId = signUp.id;
    if (!attemptId) {
      return original.apply(signUp, args);
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
      .catch((error) => {
        devLog("email verification prepare failed", error);
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

  useEffect(() => {
    if (!client) {
      return;
    }

    const signUp = client.signUp;
    const original = signUp.prepareVerification.bind(signUp);
    signUp.prepareVerification = wrapPrepareVerification(signUp, original);

    return () => {
      signUp.prepareVerification = original;
      if (signUp.id) {
        inFlightPrepares.delete(signUp.id);
      }
    };
  }, [client]);

  return null;
}
