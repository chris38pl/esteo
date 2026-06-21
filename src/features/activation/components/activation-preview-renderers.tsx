"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { ActivationTipsBanner } from "@/features/activation/components/activation-tips-banner";
import { WorkspaceReadyBanner } from "@/features/activation/components/workspace-ready-banner";
import { CompanyProfileCompletionModal } from "@/features/activation/components/company-profile-completion-modal";
import type { ActivationPreviewItemId } from "@/features/activation/lib/activation-preview-catalog";
import { AppToast } from "@/components/ui/app-toast";
import type { Locale } from "@/lib/locale";
import { cn } from "@/lib/utils";

const noop = () => {};

function PreviewFrame({
  children,
  className,
  align = "start",
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "center" | "toast-top" | "toast-bottom";
}) {
  return (
    <div
      className={cn(
        "relative min-h-[12rem] rounded-xl border border-dashed border-border/70 bg-muted/20 p-6",
        align === "center" && "flex items-center justify-center",
        align === "toast-top" && "flex min-h-[10rem] items-start justify-center pt-4",
        align === "toast-bottom" && "flex min-h-[10rem] items-end justify-center pb-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

function AiGeneratingSkeletonPreview() {
  const t = useTranslations("estimates");

  return (
    <div className="surface-card max-w-2xl space-y-4 p-6">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="relative flex size-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40 opacity-75" />
          <span className="relative inline-flex size-3 rounded-full bg-primary" />
        </span>
        {t("editor.generating")}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className={cn("h-5 w-32 animate-pulse rounded bg-muted", i === 2 && "w-40")} />
          {[1, 2, 3].map((j) => (
            <div
              key={j}
              className={cn(
                "h-9 animate-pulse rounded bg-muted/60",
                j === 1 && "w-full",
                j === 2 && "w-11/12",
                j === 3 && "w-10/12",
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const PREVIEW_EMPTY_PROFILE = {
  address: "",
  taxId: "",
  email: "",
  phone: "",
  logoStorageKey: null,
};

function CompanyProfilePortalNote() {
  const t = useTranslations("admin.activationPreview.items.company_profile_modal");
  return <p className="text-xs text-muted-foreground">{t("portalNote")}</p>;
}

function AsyncToastPositionHint() {
  const t = useTranslations("admin.activationPreview.items.pdf_export_toast");
  return <p className="text-xs text-muted-foreground">{t("positionHint")}</p>;
}

export function ActivationPreviewRenderer({
  itemId,
  locale,
}: {
  itemId: ActivationPreviewItemId;
  locale: Locale;
}) {
  const tFormBadge = useTranslations("activation.formBadge");
  const tEstimates = useTranslations("estimates");

  switch (itemId) {
    case "workspace_ready_banner":
      return (
        <PreviewFrame>
          <WorkspaceReadyBanner
            preview
            workspaceSlug="preview"
            onDismissed={noop}
            onCreateClick={noop}
            onCopyFormLink={noop}
          />
        </PreviewFrame>
      );

    case "form_link_toast":
      return (
        <PreviewFrame align="toast-top">
          <AppToast
            variant="action"
            title={tFormBadge("afterCopyTitle")}
            description={tFormBadge("afterCopyDescription")}
            progressDurationMs={5000}
          />
        </PreviewFrame>
      );

    case "form_copy_simple_toast":
      return (
        <PreviewFrame align="toast-top">
          <AppToast
            variant="success"
            title={tEstimates("list.hero.form.copied")}
            progressDurationMs={5000}
          />
        </PreviewFrame>
      );

    case "ai_generating_skeleton":
      return (
        <PreviewFrame align="center">
          <AiGeneratingSkeletonPreview />
        </PreviewFrame>
      );

    case "estimate_send_toast_loading":
      return (
        <PreviewFrame align="toast-bottom">
          <div className="w-full max-w-sm space-y-2">
            <AsyncToastPositionHint />
            <AppToast
              variant="loading"
              title={tEstimates("send.progress.generatingPdf")}
              description={tEstimates("send.progress.hint")}
              showProgress={false}
            />
          </div>
        </PreviewFrame>
      );

    case "estimate_send_toast_success":
      return (
        <PreviewFrame align="toast-bottom">
          <div className="w-full max-w-sm space-y-2">
            <AsyncToastPositionHint />
            <AppToast
              variant="success"
              title={tEstimates("send.success")}
              progressDurationMs={5000}
            />
          </div>
        </PreviewFrame>
      );

    case "estimate_send_toast_error":
      return (
        <PreviewFrame align="toast-bottom">
          <div className="w-full max-w-sm space-y-2">
            <AsyncToastPositionHint />
            <AppToast
              variant="error"
              title={tEstimates("send.error")}
              progressDurationMs={8000}
            />
          </div>
        </PreviewFrame>
      );

    case "company_profile_modal":
      return (
        <PreviewFrame align="center" className="min-h-[28rem]">
          <CompanyProfileCompletionModal
            open
            workspaceId="preview-workspace"
            workspaceSlug="preview"
            locale={locale}
            initialProfile={PREVIEW_EMPTY_PROFILE}
            initialLogoUrl={null}
            missingFields={["logo", "address", "taxId", "email", "phone"]}
            onOpenChange={noop}
            onProceed={noop}
            onProfileUpdated={noop}
          />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <CompanyProfilePortalNote />
          </div>
        </PreviewFrame>
      );

    case "pdf_export_toast":
      return (
        <PreviewFrame align="toast-bottom">
          <div className="w-full max-w-sm space-y-2">
            <AsyncToastPositionHint />
            <AppToast
              variant="loading"
              title={tEstimates("editor.pdfExport.generating")}
              description={tEstimates("editor.pdfExport.generatingHint")}
              showProgress={false}
            />
          </div>
        </PreviewFrame>
      );

    case "pdf_export_error":
      return (
        <PreviewFrame align="toast-bottom">
          <div className="w-full max-w-sm space-y-2">
            <AsyncToastPositionHint />
            <AppToast
              variant="error"
              title={tEstimates("editor.pdfExport.failed")}
              progressDurationMs={8000}
            />
          </div>
        </PreviewFrame>
      );

    case "pdf_popup_blocked_toast":
      return (
        <PreviewFrame align="toast-bottom">
          <div className="w-full max-w-sm space-y-2">
            <AsyncToastPositionHint />
            <AppToast
              variant="info"
              title={tEstimates("editor.pdfExport.popupBlocked")}
              progressDurationMs={5000}
            />
          </div>
        </PreviewFrame>
      );

    case "tips_banner":
      return (
        <PreviewFrame className="p-0">
          <ActivationTipsBanner
            workspaceSlug="preview"
            locale={locale}
            preview
          />
        </PreviewFrame>
      );

    default:
      return null;
  }
}
