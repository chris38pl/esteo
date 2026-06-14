"use client";

import type { WorkspaceBillingMemberUsage } from "@/features/billing/billing-page-data";
import { useTranslations } from "next-intl";

export function WorkspaceMemberUsageTable({
  memberUsage,
}: {
  memberUsage: WorkspaceBillingMemberUsage[];
}) {
  const t = useTranslations("billing.workspace.memberUsage");

  if (memberUsage.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-medium">{t("title")}</h2>
        <div className="rounded-xl border border-border/60 bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-medium">{t("title")}</h2>
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/30 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">{t("member")}</th>
              <th className="px-4 py-3 font-medium">{t("aiCalls")}</th>
              <th className="px-4 py-3 font-medium">{t("estimates")}</th>
            </tr>
          </thead>
          <tbody>
            {memberUsage.map((member) => (
              <tr key={member.userId} className="border-t border-border/40">
                <td className="px-4 py-3">{member.name ?? member.email}</td>
                <td className="px-4 py-3 tabular-nums">{member.aiCalls}</td>
                <td className="px-4 py-3 tabular-nums">{member.estimates}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
