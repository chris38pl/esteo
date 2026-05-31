"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReceivedInvitationView } from "@/features/workspaces/components/invitation-types";
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
  const open = invitation !== null;

  async function handleDismiss() {
    if (!invitation) {
      return;
    }

    await dismissInvitationPromptAction(invitation.id, locale);
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void handleDismiss();
        }
      }}
    >
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("modalTitle")}</DialogTitle>
          <DialogDescription>{t("modalDescription")}</DialogDescription>
        </DialogHeader>
        {invitation ? (
          <WorkspaceInvitationCard
            invitation={invitation}
            locale={locale}
            variant="embedded"
            onResolved={() => router.refresh()}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
