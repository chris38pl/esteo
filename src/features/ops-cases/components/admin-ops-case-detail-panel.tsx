"use client";

import Link from "next/link";
import { BookOpen, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { OpsCaseSeverityBadge } from "@/features/ops-cases/components/ops-case-severity-badge";
import { OpsCaseSourceBadge } from "@/features/ops-cases/components/ops-case-source-badge";
import { OpsCaseStatusBadge } from "@/features/ops-cases/components/ops-case-status-badge";
import { getOpsCaseCatalogEntry } from "@/features/ops-cases/lib/ops-case-catalog";
import { updateOpsCaseStatusAction } from "@/features/ops-cases/server/admin-actions";
import type { AdminOpsCaseDetail } from "@/features/ops-cases/server/repository";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/95 shadow-sm">
      <div className="border-b border-border/60 px-5 py-3">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-xs font-medium text-muted-foreground sm:w-40">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm leading-snug break-words text-foreground">{children}</dd>
    </div>
  );
}

function UserLink({
  user,
  locale,
}: {
  user: { id: string; name: string | null; email: string } | null;
  locale: Locale;
}) {
  if (!user) {
    return <>—</>;
  }

  return (
    <Link href={`/${locale}/dashboard/admin/users`} className="text-primary hover:underline">
      {user.name ? `${user.name} (${user.email})` : user.email}
    </Link>
  );
}

export function AdminOpsCaseDetailPanel({
  opsCase,
  locale,
}: {
  opsCase: AdminOpsCaseDetail;
  locale: Locale;
}) {
  const t = useTranslations("ops-cases.admin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const catalog = getOpsCaseCatalogEntry(opsCase.type);
  const isActive = opsCase.status === "OPEN" || opsCase.status === "IN_PROGRESS";

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  function handleStatusUpdate(status: "RESOLVED" | "IGNORED") {
    startTransition(async () => {
      const result = await updateOpsCaseStatusAction(
        {
          number: opsCase.number,
          status,
          resolutionNotes,
        },
        locale,
      );

      if (!result.success) {
        toast.error(result.error || t("detail.actions.updateFailed"));
        return;
      }

      toast.success(
        status === "RESOLVED"
          ? t("detail.actions.resolvedSuccess", { number: opsCase.number })
          : t("detail.actions.ignoredSuccess", { number: opsCase.number }),
      );
      router.refresh();
    });
  }

  const auditCommand = opsCase.affectedUser
    ? t("runbookCommands.audit", { email: opsCase.affectedUser.email })
    : null;

  return (
    <div className="mx-auto min-w-0 w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href={`/${locale}/dashboard/admin/ops-cases`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("detail.back")}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">#{opsCase.number}</h1>
            <OpsCaseStatusBadge
              status={opsCase.status}
              label={t(`status.${opsCase.status}` as "status.OPEN")}
            />
            <OpsCaseSeverityBadge
              severity={opsCase.severity}
              label={t(`severity.${opsCase.severity}` as "severity.HIGH")}
            />
            <OpsCaseSourceBadge
              source={opsCase.source}
              label={t(`source.${opsCase.source}` as "source.REFERRAL_SERVICE")}
            />
          </div>
          <p className="text-base font-medium">{opsCase.title}</p>
          {opsCase.previousIncidentsCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("detail.previousIncidents", { count: opsCase.previousIncidentsCount })}
            </p>
          ) : null}
        </div>
      </div>

      <DetailCard title={t("detail.runbook")}>
        <DetailRow label={t("detail.runbook")}>
          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm">
              <BookOpen className="size-4 shrink-0 text-primary" aria-hidden />
              <span>{t("detail.runbookHint", { path: catalog.runbookUrl })}</span>
            </p>
            <div className="space-y-2 rounded-lg bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("runbookCommands.title")}
              </p>
              {auditCommand ? (
                <div className="flex items-start gap-2">
                  <code className="flex-1 break-all text-xs">{auditCommand}</code>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 shrink-0"
                    onClick={() => void copyText(auditCommand)}
                    aria-label="Copy audit command"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                </div>
              ) : null}
              <div className="flex items-start gap-2">
                <code className="flex-1 break-all text-xs">{t("runbookCommands.backfill")}</code>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0"
                  onClick={() => void copyText(t("runbookCommands.backfill"))}
                  aria-label="Copy backfill command"
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </DetailRow>
      </DetailCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailCard title={t("detail.sections.summary")}>
          <DetailRow label={t("detail.fields.type")}>
            {t(`type.${opsCase.type}` as "type.REFERRAL_REWARD_FAILED")}
          </DetailRow>
          <DetailRow label={t("detail.fields.fingerprint")}>
            <code className="text-xs">{opsCase.fingerprint}</code>
          </DetailRow>
          <DetailRow label={t("detail.fields.summary")}>{opsCase.summary}</DetailRow>
          <DetailRow label={t("detail.fields.entity")}>
            {opsCase.entityKind && opsCase.entityId
              ? `${opsCase.entityKind}:${opsCase.entityId}`
              : "—"}
          </DetailRow>
        </DetailCard>

        <DetailCard title={t("detail.sections.people")}>
          <DetailRow label={t("detail.fields.affectedUser")}>
            <UserLink user={opsCase.affectedUser} locale={locale} />
          </DetailRow>
          <DetailRow label={t("detail.fields.actorUser")}>
            <UserLink user={opsCase.actorUser} locale={locale} />
          </DetailRow>
          <DetailRow label={t("detail.fields.workspace")}>
            {opsCase.workspace ? (
              <Link
                href={`/${locale}/dashboard/${opsCase.workspace.slug}`}
                className="text-primary hover:underline"
              >
                {opsCase.workspace.name} ({opsCase.workspace.slug})
              </Link>
            ) : (
              "—"
            )}
          </DetailRow>
        </DetailCard>
      </div>

      <DetailCard title={t("detail.sections.timeline")}>
        <DetailRow label={t("detail.fields.firstSeenAt")}>{formatDate(opsCase.firstSeenAt)}</DetailRow>
        <DetailRow label={t("detail.fields.lastSeenAt")}>{formatDate(opsCase.lastSeenAt)}</DetailRow>
        <DetailRow label={t("detail.fields.occurrenceCount")}>{opsCase.occurrenceCount}</DetailRow>
        <DetailRow label={t("detail.fields.dueAt")}>{formatDate(opsCase.dueAt)}</DetailRow>
        <DetailRow label={t("list.columns.createdAt")}>{formatDate(opsCase.createdAt)}</DetailRow>
      </DetailCard>

      <DetailCard title={t("detail.sections.payload")}>
        <div className="px-5 py-3.5">
          <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
            {JSON.stringify(opsCase.payload, null, 2)}
          </pre>
        </div>
      </DetailCard>

      {isActive ? (
        <DetailCard title={t("detail.sections.resolution")}>
          <div className="space-y-4 px-5 py-4">
            <div className="space-y-2">
              <label htmlFor="resolution-notes" className="text-sm font-medium">
                {t("detail.resolutionNotesLabel")}
              </label>
              <textarea
                id="resolution-notes"
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                placeholder={t("detail.resolutionNotesPlaceholder")}
                rows={4}
                className={cn(
                  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none",
                  "ring-offset-background focus-visible:ring-2 focus-visible:ring-ring",
                )}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={isPending || resolutionNotes.trim().length === 0}
                onClick={() => handleStatusUpdate("RESOLVED")}
              >
                {t("detail.actions.resolve")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending || resolutionNotes.trim().length === 0}
                onClick={() => handleStatusUpdate("IGNORED")}
              >
                {t("detail.actions.ignore")}
              </Button>
            </div>
          </div>
        </DetailCard>
      ) : (
        <DetailCard title={t("detail.sections.resolution")}>
          <DetailRow label={t("detail.fields.status")}>
            <OpsCaseStatusBadge
              status={opsCase.status}
              label={t(`status.${opsCase.status}` as "status.RESOLVED")}
            />
          </DetailRow>
          <DetailRow label={t("detail.resolutionNotesLabel")}>
            {opsCase.resolutionNotes ?? "—"}
          </DetailRow>
          <DetailRow label={t("detail.fields.lastSeenAt")}>{formatDate(opsCase.resolvedAt)}</DetailRow>
          <DetailRow label="Resolved by">
            <UserLink user={opsCase.resolvedBy} locale={locale} />
          </DetailRow>
        </DetailCard>
      )}
    </div>
  );
}
