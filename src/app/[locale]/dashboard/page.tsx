import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { requireAuth } from "@/server/auth/require-auth";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireAuth();

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signed in and synced to the database.
          </p>
        </div>
        <UserButton />
      </div>

      <section className="w-full max-w-xl space-y-2 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">User ID</p>
        <p className="font-mono text-sm">{user.id}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Email</p>
        <p className="text-sm">{user.email}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Clerk ID</p>
        <p className="font-mono text-sm">{user.clerkId}</p>
      </section>

      <Link
        href={`/${locale}`}
        className="text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Back to home
      </Link>
    </main>
  );
}
