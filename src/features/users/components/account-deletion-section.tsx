"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { DeleteAccountDialog } from "@/features/users/components/delete-account-dialog";
import type { OwnedWorkspaceBlockingDeletion } from "@/features/users/server/account-deletion-guard";
import type { Locale } from "@/lib/locale";

export function AccountDeletionSection({
  locale,
  ownedWorkspacesBlockingDeletion,
}: {
  locale: Locale;
  ownedWorkspacesBlockingDeletion: OwnedWorkspaceBlockingDeletion[];
}) {
  const tGuard = useTranslations("navbar.userMenu.deletionGuard");
  const tDeletion = useTranslations("navbar.userMenu.accountDeletion");
  const [dialogOpen, setDialogOpen] = useState(false);

  const isBlocked = ownedWorkspacesBlockingDeletion.length > 0;

  return (
    <>
      <section
        className={
          isBlocked
            ? "rounded-2xl border border-amber-300/60 bg-amber-50/80 p-6 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 lg:col-span-2"
            : "rounded-2xl border border-border/60 bg-card p-6 shadow-sm lg:col-span-2"
        }
      >
        <h2 className="text-base font-semibold tracking-tight">
          {isBlocked ? tGuard("title") : tDeletion("sectionTitle")}
        </h2>

        {isBlocked ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">{tGuard("description")}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {ownedWorkspacesBlockingDeletion.map((workspace) => (
                <li key={workspace.id}>
                  {workspace.name} ({workspace.slug}) - {workspace.plan}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">{tDeletion("sectionDescription")}</p>
            <Button
              type="button"
              variant="destructive"
              className="mt-4"
              onClick={() => setDialogOpen(true)}
            >
              {tDeletion("deleteButton")}
            </Button>
          </>
        )}
      </section>

      {!isBlocked ? (
        <DeleteAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} locale={locale} />
      ) : null}
    </>
  );
}
