import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { requireAuth } from "@/server/auth/require-auth";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await requireAuth();

  return (
    <main className="flex-1">
      <DashboardFrame
        sidebar={
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Navigation</p>
            <p className="rounded-md bg-sidebar-accent px-3 py-2">Dashboard</p>
            <p className="rounded-md px-3 py-2 text-muted-foreground">
              Requests
            </p>
            <p className="rounded-md px-3 py-2 text-muted-foreground">
              Estimates
            </p>
          </div>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Signed in and synced to the database.
            </p>
          </div>
          <UserButton />
        </div>

        <section className="surface-card w-full max-w-xl space-y-2 p-6">
          <p className="text-sm text-muted-foreground">User ID</p>
          <p className="font-mono text-sm">{user.id}</p>
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-sm">{user.email}</p>
          <p className="text-sm text-muted-foreground">Clerk ID</p>
          <p className="font-mono text-sm">{user.clerkId}</p>
        </section>

        <Link
          href={`/${locale}`}
          className="text-sm font-medium text-primary underline"
        >
          Back to home
        </Link>
      </DashboardFrame>
    </main>
  );
}
