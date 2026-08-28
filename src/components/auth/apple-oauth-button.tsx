"use client";

import * as Clerk from "@clerk/elements/common";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AUTH_APPLE_SIGN_IN_ENABLED } from "@/lib/auth-oauth-providers";

function AppleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export function AppleOAuthButton({
  label,
  disabled = false,
}: {
  label: string;
  disabled?: boolean;
}) {
  const t = useTranslations("auth.oauth");
  const isDisabled = disabled || !AUTH_APPLE_SIGN_IN_ENABLED;

  const button = (
    <Button
      type="button"
      variant="outline"
      disabled={isDisabled}
      className="h-11 w-full gap-2 rounded-lg border-border/40 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
    >
      <AppleIcon />
      {label}
    </Button>
  );

  if (!AUTH_APPLE_SIGN_IN_ENABLED) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block w-full">{button}</span>
          </TooltipTrigger>
          <TooltipContent side="top">{t("appleComingSoon")}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Clerk.Connection name="apple" asChild>
      {button}
    </Clerk.Connection>
  );
}
