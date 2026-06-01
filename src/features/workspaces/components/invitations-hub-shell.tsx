"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const INVITATIONS_BG_LIGHT = "/invitations/invitations-light.png";
export const INVITATIONS_BG_DARK = "/invitations/invitations-dark.png";

export function InvitationsHubShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate flex min-h-dvh w-full flex-col items-center justify-center",
        "p-3 sm:p-4 md:px-6 md:py-16",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex w-full flex-col justify-center",
          "md:mx-auto md:min-h-[min(85dvh,760px)] md:w-[75vw] md:max-w-5xl md:overflow-hidden md:rounded-3xl md:border md:border-border/60 md:shadow-sm",
        )}
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block">
          <Image
            src={INVITATIONS_BG_LIGHT}
            alt=""
            fill
            priority
            sizes="75vw"
            className="object-cover object-center dark:hidden"
          />
          <Image
            src={INVITATIONS_BG_DARK}
            alt=""
            fill
            priority
            sizes="75vw"
            className="hidden object-cover object-center dark:block"
          />
          <div className="absolute inset-0 bg-background/15 dark:bg-black/25" />
        </div>

        <div
          className={cn(
            "relative z-10 flex w-full flex-col items-center justify-center",
            "py-4 md:min-h-[min(85dvh,760px)] md:px-10 md:py-14",
          )}
        >
          <div className="w-full md:max-w-[480px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
