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
        "relative isolate flex min-h-dvh flex-col items-center justify-center px-4 py-20 sm:px-6",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <Image
          src={INVITATIONS_BG_LIGHT}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center dark:hidden"
        />
        <Image
          src={INVITATIONS_BG_DARK}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center dark:block"
        />
        <div className="absolute inset-0 bg-background/15 dark:bg-black/25" />
      </div>

      <div className="relative z-10 w-full max-w-md sm:max-w-[440px]">{children}</div>
    </div>
  );
}
