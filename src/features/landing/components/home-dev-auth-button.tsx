"use client";

import { SignedIn } from "@clerk/nextjs";

import { ClerkUserButton } from "@/components/auth/clerk-user-button";

/** Floating Clerk user menu — rendered only on the homepage in development. */
export function HomeDevAuthButton() {
  return (
    <SignedIn>
      <div className="fixed right-4 top-14 z-50 rounded-full border border-border/60 bg-card/90 p-0.5 opacity-90 shadow-lg backdrop-blur-sm lg:top-4">
        <ClerkUserButton />
      </div>
    </SignedIn>
  );
}
