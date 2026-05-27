import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { getCurrentUser } from "@/server/auth/get-current-user";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  return (
    <main className="surface-base flex flex-1 items-center justify-center px-6 py-16 font-sans">
      <div className="surface-card w-full max-w-xl space-y-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Esteo</h1>
            <p className="text-sm text-muted-foreground">
              Locale: <span className="font-medium">{locale}</span>
            </p>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        <SignedOut>
          <p className="text-sm text-muted-foreground">
            Sign in to sync your Clerk account with the Esteo database.
          </p>
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Sign in
          </Link>
        </SignedOut>

        <SignedIn>
          <div className="space-y-3 text-sm">
            <p>
              Synced user:{" "}
              <span className="font-medium">{user?.email ?? "Syncing..."}</span>
            </p>
            <Link
              href={`/${locale}/dashboard`}
              className="inline-flex font-medium underline"
            >
              Go to dashboard
            </Link>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
