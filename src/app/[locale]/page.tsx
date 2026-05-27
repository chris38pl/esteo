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
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <div className="w-full max-w-xl space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Esteo</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Locale: <span className="font-medium">{locale}</span>
            </p>
          </div>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        <SignedOut>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to sync your Clerk account with the Esteo database.
          </p>
          <Link
            href={`/${locale}/sign-in`}
            className="inline-flex rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
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
