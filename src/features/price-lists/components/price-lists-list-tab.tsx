"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { appToast } from "@/components/ui/app-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { templateDefaultBadgeColors } from "@/features/estimate-templates/lib/template-ui-styles";
import {
  deletePriceListAction,
  setDefaultPriceListAction,
} from "@/features/workspace-configuration/server/actions";
import type {
  ConfigurationAccess,
  SerializedPriceList,
} from "@/features/workspace-configuration/server/service";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

function PremiumReadOnlyNotice({ reason }: { reason: ConfigurationAccess["reason"] }) {
  const t = useTranslations("workspaces.configuration");
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm">
      <p className="font-medium text-foreground">
        {reason === "FREE_PLAN" ? t("premium.freeTitle") : t("premium.readOnlyTitle")}
      </p>
      <p className="mt-1 text-muted-foreground">
        {reason === "FREE_PLAN" ? t("premium.freeDescription") : t("premium.readOnlyDescription")}
      </p>
    </div>
  );
}

function PriceListCard({
  priceList,
  locale,
  workspaceId,
  workspaceSlug,
  defaultPriceListId,
  canEdit,
  isPending,
}: {
  priceList: SerializedPriceList;
  locale: Locale;
  workspaceId: string;
  workspaceSlug: string;
  defaultPriceListId: string | null;
  canEdit: boolean;
  isPending: boolean;
}) {
  const t = useTranslations("workspaces.configuration.priceLists");
  const tToast = useTranslations("workspaces.configuration.priceLists.toast");
  const router = useRouter();
  const [, startTransition] = useTransition();
  const editHref = `/${locale}/dashboard/${workspaceSlug}/configuration/price-lists/${priceList.id}`;
  const isDefault = priceList.id === defaultPriceListId;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={editHref} className="font-semibold hover:text-primary hover:underline">
              {priceList.name}
            </Link>
            {isDefault ? (
              <Badge
                className={cn(
                  "inline-flex h-6 items-center rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide",
                  templateDefaultBadgeColors,
                )}
              >
                {t("defaultBadge")}
              </Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("itemCount", { count: priceList.items.length, currency: priceList.currency })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon-sm" className="size-9" disabled={isPending}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isDefault ? (
                  <DropdownMenuItem
                    onClick={() =>
                      startTransition(async () => {
                        const result = await setDefaultPriceListAction(
                          { workspaceId, workspaceSlug, priceListId: priceList.id },
                          locale,
                        );
                        if (!result.success) appToast.error(result.error);
                        else appToast.success(tToast("defaultSet"));
                        router.refresh();
                      })
                    }
                  >
                    {t("setDefault")}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem variant="destructive" asChild>
                  <button
                    type="button"
                    onClick={() =>
                      startTransition(async () => {
                        const result = await deletePriceListAction(
                          { workspaceId, workspaceSlug, priceListId: priceList.id },
                          locale,
                        );
                        if (!result.success) appToast.error(result.error);
                        else {
                          appToast.success(tToast("deleted"));
                          router.refresh();
                        }
                      })
                    }
                  >
                    {t("delete")}
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button variant="outline" size="sm" asChild={canEdit} disabled={!canEdit}>
            {canEdit ? <Link href={editHref}>{t("edit")}</Link> : <span>{t("edit")}</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PriceListsListTab({
  workspaceId,
  workspaceSlug,
  locale,
  priceLists,
  defaultPriceListId,
  access,
}: {
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
  priceLists: SerializedPriceList[];
  defaultPriceListId: string | null;
  access: ConfigurationAccess;
}) {
  const t = useTranslations("workspaces.configuration.priceLists");
  const tToast = useTranslations("workspaces.configuration.priceLists.toast");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const canEdit = access.canEditPremiumConfiguration;
  const newPriceListHref = `/${locale}/dashboard/${workspaceSlug}/configuration/price-lists/new`;

  return (
    <div className="space-y-6">
      {!canEdit ? <PremiumReadOnlyNotice reason={access.reason} /> : null}

      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="space-y-6 p-5 md:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="min-w-0 space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
            </div>

            <Button className="h-10 w-full shrink-0 justify-center gap-2 whitespace-nowrap px-4 sm:w-auto" disabled={!canEdit} asChild={canEdit}>
              {canEdit ? (
                <Link href={newPriceListHref}>
                  <Plus className="size-4 shrink-0" />
                  {t("create")}
                </Link>
              ) : (
                <>
                  <Plus className="size-4 shrink-0" />
                  {t("create")}
                </>
              )}
            </Button>
          </div>

          {priceLists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              {t("empty")}
            </div>
          ) : (
            <div className="grid gap-3">
              {priceLists.map((priceList) => (
                <PriceListCard
                  key={priceList.id}
                  priceList={priceList}
                  locale={locale}
                  workspaceId={workspaceId}
                  workspaceSlug={workspaceSlug}
                  defaultPriceListId={defaultPriceListId}
                  canEdit={canEdit}
                  isPending={isPending}
                />
              ))}
            </div>
          )}

          {defaultPriceListId && canEdit ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await setDefaultPriceListAction(
                    { workspaceId, workspaceSlug, priceListId: null },
                    locale,
                  );
                  if (!result.success) appToast.error(result.error);
                  else appToast.success(tToast("defaultCleared"));
                  router.refresh();
                })
              }
            >
              {t("clearDefault")}
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
