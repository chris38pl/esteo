"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, PlusCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { EstimateVersionStatus } from "@prisma/client";

import { appToast } from "@/components/ui/app-toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { EstimateNavigationOverlay } from "@/features/estimates/components/estimate-navigation-overlay";
import { createNewVersionAction } from "@/features/estimates/server/actions";
import { estimateOutlineButtonClassName } from "./estimate-action-button-styles";
import type { Locale } from "@/lib/locale";

interface Version {
  id: string;
  versionNumber: number;
  status: EstimateVersionStatus;
  archivedAt?: string | null;
}

interface EstimateVersionSelectorProps {
  estimateId: string;
  workspaceId: string;
  versions: Version[];
  activeVersionId: string;
  locale?: string;
  workspaceSlug: string;
}

const statusVariant: Record<
  EstimateVersionStatus | "ARCHIVED",
  "default" | "secondary" | "outline"
> = {
  DRAFT: "secondary",
  SENT: "default",
  ACCEPTED: "default",
  REJECTED: "outline",
  ARCHIVED: "outline",
};

export function EstimateVersionSelector({
  estimateId,
  workspaceId,
  versions,
  activeVersionId,
  locale = "pl",
  workspaceSlug,
}: EstimateVersionSelectorProps) {
  const t = useTranslations("estimates");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreating, setIsCreating] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];

  useEffect(() => {
    setIsSwitching(false);
  }, [activeVersionId]);

  const statusLabel = (version: Version) => {
    if (version.archivedAt) {
      return t("status.ARCHIVED");
    }
    return t(`status.${version.status}`);
  };

  const statusBadgeVariant = (version: Version) => {
    if (version.archivedAt) {
      return statusVariant.ARCHIVED;
    }
    return statusVariant[version.status];
  };

  const handleSelectVersion = (version: Version) => {
    if (version.id === activeVersionId) {
      return;
    }

    setIsSwitching(true);
    router.push(
      `/${locale}/dashboard/${workspaceSlug}/estimates/${estimateId}?v=${version.versionNumber}`,
    );
  };

  const handleCreateVersion = () => {
    if (isCreating || isPending) return;
    setIsCreating(true);
    startTransition(async () => {
      try {
        const result = await createNewVersionAction({
          estimateId,
          workspaceId,
          workspaceSlug,
          locale: locale as Locale,
        });

        if (result.success) {
          router.replace(
            `/${locale}/dashboard/${workspaceSlug}/estimates/${estimateId}?v=${result.data.versionNumber}`,
          );
          return;
        }

        appToast.error(result.error);
      } finally {
        setIsCreating(false);
      }
    });
  };

  const showOverlay = isCreating || isSwitching;

  return (
    <>
      {showOverlay ? (
        <EstimateNavigationOverlay
          label={isCreating ? t("versions.creating") : t("versions.switching")}
          hint={isCreating ? t("versions.creatingHint") : t("versions.switchingHint")}
        />
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={estimateOutlineButtonClassName}
            disabled={isCreating || isPending || isSwitching}
          >
            {isCreating || isSwitching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            <span className="font-medium">
              {t("versions.shortVersionLabel", { n: activeVersion?.versionNumber ?? 1 })}
            </span>
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {versions.map((version) => (
            <DropdownMenuItem
              key={version.id}
              onClick={() => handleSelectVersion(version)}
              className="flex items-center justify-between"
            >
              <span>{t("versions.versionLabel", { n: version.versionNumber })}</span>
              <Badge variant={statusBadgeVariant(version)} className="text-xs">
                {statusLabel(version)}
              </Badge>
            </DropdownMenuItem>
          ))}
          {versions.length < 10 ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleCreateVersion}
                disabled={isPending || isCreating || isSwitching}
                className="gap-2"
              >
                {isCreating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PlusCircle className="size-4" />
                )}
                {isCreating ? t("versions.creating") : t("versions.createNewVersion")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
