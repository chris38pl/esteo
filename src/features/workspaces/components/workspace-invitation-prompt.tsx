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
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
import { InvitationsHubBackdrop } from "@/features/workspaces/components/invitations-hub-shell";
import { WorkspaceInvitationCard } from "@/features/workspaces/components/workspace-invitation-card";
import { dismissInvitationPromptAction } from "@/features/workspaces/server/actions";
import type { Locale } from "@/lib/locale";

export function WorkspaceInvitationPrompt({
  invitation,
  locale,
}: {
  invitation: ReceivedInvitationView | null;
  locale: Locale;
}) {
  const t = useTranslations("workspaces.invitations");
  const router = useRouter();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!invitation) {
      setDialogOpen(false);
      return;
    }

    const id = requestAnimationFrame(() => setDialogOpen(true));
    return () => cancelAnimationFrame(id);
  }, [invitation?.id, pathname]);

  async function handleDismiss() {
    if (!invitation) {
      return;
    }

    setDialogOpen(false);
    await dismissInvitationPromptAction(invitation.id, locale);
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
          <DialogTitle>{t("modalTitle")}</DialogTitle>
          <DialogDescription>{t("modalDescription")}</DialogDescription>
        </DialogHeader>
        {invitation ? (
          <div className="relative isolate min-h-[min(72dvh,620px)] w-full overflow-hidden rounded-3xl border border-border/60 shadow-sm">
            <InvitationsHubBackdrop
              alwaysVisible
              priority={false}
              imageSizes="(max-width: 50rem) 96vw, 50rem"
              className="rounded-3xl"
            />
            <div className="relative z-10 flex min-h-[min(72dvh,620px)] w-full flex-col items-center justify-center px-10 py-12 sm:px-14 sm:py-16">
              <div className="w-full max-w-[30rem]">
                <WorkspaceInvitationCard
                  invitation={invitation}
                  locale={locale}
                  variant="hero"
                  heroPresentation="modal"
                  onResolved={() => router.refresh()}
                />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
