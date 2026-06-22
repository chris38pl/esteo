"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { appToast } from "@/components/ui/app-toast";

function InvitationsHubFeedbackInner() {
  const t = useTranslations("workspaces.invitations");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const inviteAccepted = searchParams.get("inviteAccepted");
    const inviteDeclined = searchParams.get("inviteDeclined");
    const inviteError = searchParams.get("inviteError");

    if (!inviteAccepted && !inviteDeclined && !inviteError) {
      return;
    }

    const signature = `${inviteAccepted ?? ""}:${inviteDeclined ?? ""}:${inviteError ?? ""}`;
    if (handledRef.current === signature) {
      return;
    }
    handledRef.current = signature;

    if (inviteAccepted === "1") {
      appToast.success(t("actionAccepted"));
    } else if (inviteDeclined === "1") {
      appToast.success(t("actionDeclined"));
    } else if (inviteError) {
      const errorKey = inviteError as "not_found" | "invalid" | "generic" | "WORKSPACE_SEAT_LIMIT";
      const message =
        errorKey === "WORKSPACE_SEAT_LIMIT"
          ? t("errors.WORKSPACE_SEAT_LIMIT")
          : t(`actionErrors.${errorKey}` as "actionErrors.not_found");
      appToast.error(message);
    }

    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams, t]);

  return null;
}

export function InvitationsHubFeedback() {
  return (
    <Suspense fallback={null}>
      <InvitationsHubFeedbackInner />
    </Suspense>
  );
}
