import { redirect } from "next/navigation";

import { setRequestLocale } from "next-intl/server";



import { WorkspaceBillingPanel } from "@/features/billing/components/workspace-billing-panel";

import { getWorkspaceBillingPageData } from "@/features/billing/server/get-workspace-billing-page-data";

import type { Locale } from "@/lib/locale";

import { isLocale } from "@/lib/locale";

import { requireAuth } from "@/server/auth/require-auth";

import { requireRole } from "@/server/permissions/require-workspace";

import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";



export default async function WorkspaceBillingPage({

  params,

  searchParams,

}: {

  params: Promise<{ locale: string; workspaceSlug: string }>;

  searchParams: Promise<{ checkout?: string }>;

}) {

  const { locale, workspaceSlug } = await params;

  const { checkout } = await searchParams;

  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";



  setRequestLocale(resolvedLocale);



  const user = await requireAuth(resolvedLocale);

  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);



  if (!resolved) {

    redirect(`/${resolvedLocale}/dashboard`);

  }



  // Billing management is owner-only.

  try {

    await requireRole(user, resolved.workspace.id, "OWNER");

  } catch {

    redirect(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}`);

  }



  // Legacy Stripe success_url shim — mutation happens in checkout-success/route.ts.

  if (checkout === "success") {

    redirect(`/${resolvedLocale}/dashboard/${resolved.canonicalSlug}/billing/checkout-success`);

  }



  const data = await getWorkspaceBillingPageData(resolved.workspace.id);



  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1400px] flex-1 flex-col pb-8">
      <WorkspaceBillingPanel workspaceId={resolved.workspace.id} data={data} />
    </div>
  );

}


