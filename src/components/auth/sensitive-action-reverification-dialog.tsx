"use client";

import { useSession } from "@clerk/nextjs";
import type { SessionVerificationLevel } from "@clerk/types";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type VerificationMode = "password" | "email_code";

function resolveVerificationLevel(level: SessionVerificationLevel | undefined): SessionVerificationLevel {
  return level ?? "first_factor";
}

export function SensitiveActionReverificationDialog({
  open,
  level,
  onComplete,
  onCancel,
}: {
  open: boolean;
  level: SessionVerificationLevel | undefined;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("auth.reverification");
  const { session } = useSession();
  const [mode, setMode] = useState<VerificationMode | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [emailIdentifier, setEmailIdentifier] = useState("");
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const [supportsPassword, setSupportsPassword] = useState(false);
  const [supportsEmailCode, setSupportsEmailCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const verificationStarted = useRef(false);

  function resetState() {
    setMode(null);
    setPassword("");
    setShowPassword(false);
    setCode("");
    setEmailIdentifier("");
    setEmailAddressId(null);
    setSupportsPassword(false);
    setSupportsEmailCode(false);
    setError(null);
    setPending(false);
    setInitializing(false);
    verificationStarted.current = false;
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      onCancel();
      resetState();
    }
  }

  async function prepareEmailVerification(
    emailFactor: Extract<
      NonNullable<
        Awaited<ReturnType<NonNullable<ReturnType<typeof useSession>["session"]>["startVerification"]>>["supportedFirstFactors"]
      >[number],
      { strategy: "email_code" }
    >,
  ) {
    if (!session || emailFactor.strategy !== "email_code") {
      return;
    }

    await session.prepareFirstFactorVerification({
      strategy: "email_code",
      emailAddressId: emailFactor.emailAddressId,
    });
    setEmailAddressId(emailFactor.emailAddressId);
    setEmailIdentifier(emailFactor.safeIdentifier);
    setMode("email_code");
  }

  useEffect(() => {
    if (!open || !session) {
      return;
    }

    if (verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;
    setInitializing(true);
    setError(null);

    void (async () => {
      try {
        const response = await session.startVerification({
          level: resolveVerificationLevel(level),
        });
        const factors = response.supportedFirstFactors ?? [];
        const hasPassword = factors.some((factor) => factor.strategy === "password");
        const emailFactor = factors.find((factor) => factor.strategy === "email_code");

        setSupportsPassword(hasPassword);
        setSupportsEmailCode(Boolean(emailFactor));

        if (hasPassword) {
          setMode("password");
          return;
        }

        if (emailFactor && emailFactor.strategy === "email_code") {
          await prepareEmailVerification(emailFactor);
          return;
        }

        setError(t("errors.unsupported"));
      } catch {
        setError(t("errors.generic"));
      } finally {
        setInitializing(false);
      }
    })();
  }, [open, session, level, t]);

  async function switchToEmailCode() {
    if (!session || pending) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await session.startVerification({
        level: resolveVerificationLevel(level),
      });
      const emailFactor = (response.supportedFirstFactors ?? []).find(
        (factor) => factor.strategy === "email_code",
      );

      if (!emailFactor || emailFactor.strategy !== "email_code") {
        setError(t("errors.unsupported"));
        return;
      }

      await prepareEmailVerification(emailFactor);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!session || !mode || pending) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      if (mode === "password") {
        await session.attemptFirstFactorVerification({
          strategy: "password",
          password,
        });
      } else if (mode === "email_code" && emailAddressId) {
        await session.attemptFirstFactorVerification({
          strategy: "email_code",
          code: code.trim(),
        });
      }

      resetState();
      onComplete();
    } catch {
      setError(mode === "password" ? t("errors.invalidPassword") : t("errors.invalidCode"));
    } finally {
      setPending(false);
    }
  }

  const canSwitchMethod = supportsPassword && supportsEmailCode && mode === "password";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {mode === "email_code" && emailIdentifier
              ? t("emailDescription", { email: emailIdentifier })
              : t("passwordDescription")}
          </DialogDescription>
        </DialogHeader>

        {initializing ? (
          <p className="py-4 text-sm text-muted-foreground">{t("loading")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "password" ? (
              <div className="space-y-2">
                <Label htmlFor="reverification-password">{t("passwordLabel")}</Label>
                <div className="relative">
                  <Input
                    id="reverification-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={pending}
                    className="h-10 rounded-lg pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            ) : null}

            {mode === "email_code" ? (
              <div className="space-y-2">
                <Label htmlFor="reverification-code">{t("codeLabel")}</Label>
                <Input
                  id="reverification-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  disabled={pending}
                  className="h-10 rounded-lg"
                  autoFocus
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
              <Button
                type="submit"
                className="h-11 w-full rounded-lg"
                disabled={pending || (mode === "password" ? !password : !code.trim())}
              >
                {pending ? t("submitting") : t("continue")}
              </Button>

              {canSwitchMethod ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full rounded-lg text-muted-foreground"
                  onClick={() => void switchToEmailCode()}
                  disabled={pending}
                >
                  {t("useAnotherMethod")}
                </Button>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-lg"
                onClick={() => handleOpenChange(false)}
                disabled={pending}
              >
                {t("cancel")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
