"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { UserAvatar } from "@/components/avatars/user-avatar";
import { DashboardPanelCard } from "@/features/dashboard/components/dashboard-panel-card";
import { formatRelativeAgo } from "@/features/dashboard/lib/format-relative-ago";
import type { DashboardActivityFeedItem } from "@/features/dashboard/lib/dashboard-overview-types";
import type { Locale } from "@/lib/locale";

interface DashboardRecentActivityCardProps {
  items: DashboardActivityFeedItem[];
  workspaceSlug: string;
  locale: Locale;
}

function ActivityDescription({ item }: { item: DashboardActivityFeedItem }) {
  const t = useTranslations("dashboard.overview.activity");

  const actor = item.isCurrentUser ? t("you") : item.actorName;

  if (item.kind === "document_added" && item.documentName) {
    return (
      <p className="text-sm leading-relaxed text-foreground">
        <span className="font-medium">{actor}</span>{" "}
        <span className="text-muted-foreground">
          {item.isCurrentUser ? t("actions.documentAddedYou") : t("actions.documentAdded")}
        </span>{" "}
        <span className="font-medium text-primary">{item.documentName}</span>
        {item.workspaceName ? (
          <>
            {" "}
            <span className="text-muted-foreground">
              {t("actions.inWorkspace", { workspace: item.workspaceName })}
            </span>
          </>
        ) : null}
      </p>
    );
  }

  if (item.kind === "request_completed" && item.requestTitle) {
    return (
      <p className="text-sm leading-relaxed text-foreground">
        <span className="font-medium">{actor}</span>{" "}
        <span className="text-muted-foreground">{t("actions.requestCompleted")}</span>{" "}
        <span className="font-medium">„{item.requestTitle}”</span>
      </p>
    );
  }

  if (item.kind === "estimate_sent" && item.estimateTitle) {
    return (
      <p className="text-sm leading-relaxed text-foreground">
        <span className="font-medium">{actor}</span>{" "}
        <span className="text-muted-foreground">{t("actions.estimateSent")}</span>{" "}
        <span className="font-medium">„{item.estimateTitle}”</span>
      </p>
    );
  }

  return null;
}

export function DashboardRecentActivityCard({
  items,
  workspaceSlug,
  locale,
}: DashboardRecentActivityCardProps) {
  const t = useTranslations("dashboard.overview.activity");
  const estimatesHref = `/${locale}/dashboard/${workspaceSlug}/estimates`;

  return (
    <DashboardPanelCard
      title={t("title")}
      footer={
        <Link
          href={estimatesHref}
          className="block text-center text-sm font-medium text-primary hover:underline"
        >
          {t("footer")}
        </Link>
      }
    >
      <ul className="divide-y divide-border/60">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-5 py-4">
            <UserAvatar
              imageUrl={item.actor.avatarUrl}
              avatarPreset={item.actor.avatarPreset}
              size={36}
              className="shrink-0"
            />
            <div className="min-w-0 flex-1">
              <ActivityDescription item={item} />
            </div>
            <time
              dateTime={item.occurredAt}
              className="shrink-0 text-xs text-muted-foreground"
            >
              {formatRelativeAgo(locale, item.occurredAt)}
            </time>
          </li>
        ))}
      </ul>
    </DashboardPanelCard>
  );
}
