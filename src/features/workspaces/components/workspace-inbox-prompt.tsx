"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ModalInboxItemView } from "@/features/workspaces/components/inbox-modal-types";
import { InvitationsHubBackdrop } from "@/features/workspaces/components/invitations-hub-shell";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import { WorkspaceTransferCard } from "@/features/workspaces/components/workspace-transfer-card";
import {
  dismissInvitationPromptAction,
  dismissTransferPromptAction,
} from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

export function WorkspaceInboxPrompt({
  inboxItem,
  locale,
}: {
  inboxItem: ModalInboxItemView | null;
  locale: Locale;
}) {
  const tInvitations = useTranslations("workspaces.invitations");
  const tTransfer = useTranslations("workspaces.transfer");
  const router = useRouter();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  const modalTitle =
    inboxItem?.kind === "transfer" ? tTransfer("modalTitle") : tInvitations("modalTitle");
  const modalDescription =
    inboxItem?.kind === "transfer"
      ? tTransfer("modalDescription")
      : tInvitations("modalDescription");

  const itemId = inboxItem
    ? inboxItem.kind === "invitation"
      ? inboxItem.invitation.id
      : inboxItem.transfer.id
    : null;

  useEffect(() => {
    if (!inboxItem) {
      setDialogOpen(false);
      return;
    }

    const id = requestAnimationFrame(() => setDialogOpen(true));
    return () => cancelAnimationFrame(id);
  }, [itemId, pathname]);

  async function handleDismiss() {
    if (!inboxItem) {
      return;
    }

    setDialogOpen(false);

    if (inboxItem.kind === "invitation") {
      await dismissInvitationPromptAction(inboxItem.invitation.id, locale);
    } else {
      await dismissTransferPromptAction(inboxItem.transfer.id, locale);
    }

    router.refresh();
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void handleDismiss();
        }
      }}
    >
      <DialogContent
        showCloseButton
        className="overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-[min(96vw,50rem)] [&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:text-foreground/80 [&>[data-slot=dialog-close]]:hover:text-foreground"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>{modalDescription}</DialogDescription>
        </DialogHeader>
        {inboxItem ? (
          <div className="relative isolate min-h-[min(72dvh,620px)] w-full overflow-hidden rounded-3xl border border-border/60 shadow-sm">
            <InvitationsHubBackdrop
              alwaysVisible
              priority={false}
              imageSizes="(max-width: 50rem) 96vw, 50rem"
              className="rounded-3xl"
            />
            <div className="relative z-10 flex min-h-[min(72dvh,620px)] w-full flex-col items-center justify-center px-10 py-12 sm:px-14 sm:py-16">
              <div className="w-full max-w-[30rem]">
                {inboxItem.kind === "invitation" ? (
                  <WorkspaceInvitationCard
                    invitation={inboxItem.invitation}
                    locale={locale}
                    variant="hero"
                    heroPresentation="modal"
                    onResolved={() => router.refresh()}
                  />
                ) : (
                  <WorkspaceTransferCard
                    transfer={inboxItem.transfer}
                    locale={locale}
                    variant="hero"
                    heroPresentation="modal"
                    onResolved={() => router.refresh()}
                  />
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
