"use client";

import { UserButton } from "@clerk/nextjs";

/** Client boundary wrapper — avoids Turbopack RSC manifest errors with Clerk UI. */
export function ClerkUserButton() {
  return <UserButton />;
}
