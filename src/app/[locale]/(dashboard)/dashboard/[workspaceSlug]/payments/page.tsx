import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { PaymentsListPanel } from "@/features/payments/components/payments-list-panel";
import { loadPaymentsForListPage } from "@/features/payments/server/list-payments-page-data";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { resolveWorkspaceBySlug } from "@/server/workspaces/active-workspace";

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string }>;
}) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale: Locale = isLocale(locale) ? locale : "pl";

  setRequestLocale(resolvedLocale);

  const user = await requireAuth(resolvedLocale);
  const resolved = await resolveWorkspaceBySlug(workspaceSlug, user.id);

  if (!resolved) {
    redirect(`/${resolvedLocale}/dashboard`);
  }

  const payments = await loadPaymentsForListPage(resolved.workspace.id, resolvedLocale);

  return (
    <PaymentsListPanel
      payments={payments}
      workspaceSlug={workspaceSlug}
      locale={resolvedLocale}
    />
  );
}
