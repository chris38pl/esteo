"use client";



import { useRouter } from "next/navigation";

import { ChevronDown, PlusCircle } from "lucide-react";

import { useState, useTransition } from "react";

import { useTranslations } from "next-intl";



import { Button } from "@/components/ui/button";

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuSeparator,

  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";

import { Badge } from "@/components/ui/badge";

import { createNewVersionAction } from "@/features/estimates/server/actions";

import type { EstimateVersionStatus } from "@prisma/client";



interface Version {

  id: string;

  versionNumber: number;

  status: EstimateVersionStatus;

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

  EstimateVersionStatus,

  "default" | "secondary" | "outline"

> = {

  DRAFT: "secondary",

  SENT: "default",

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



  const activeVersion = versions.find((v) => v.id === activeVersionId) ?? versions[0];



  const statusLabel = (status: EstimateVersionStatus) => t(`status.${status}`);



  const handleSelectVersion = (version: Version) => {

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

          locale: locale as "pl" | "en",

        });



        if (result.success) {

          router.replace(

            `/${locale}/dashboard/${workspaceSlug}/estimates/${estimateId}?v=${result.data.versionNumber}`,

          );

        }

      } finally {

        setIsCreating(false);

      }

    });

  };



  return (

    <DropdownMenu>

      <DropdownMenuTrigger asChild>

        <Button variant="outline" size="sm" className="gap-2" disabled={isCreating || isPending}>

          <span className="font-medium">v{activeVersion?.versionNumber ?? 1}</span>

          {activeVersion && (

            <Badge variant={statusVariant[activeVersion.status]} className="text-xs">

              {statusLabel(activeVersion.status)}

            </Badge>

          )}

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

            <Badge variant={statusVariant[version.status]} className="text-xs">

              {statusLabel(version.status)}

            </Badge>

          </DropdownMenuItem>

        ))}

        {versions.length < 10 && (

          <>

            <DropdownMenuSeparator />

            <DropdownMenuItem

              onClick={handleCreateVersion}

              disabled={isPending || isCreating}

              className="gap-2"

            >

              <PlusCircle className="size-4" />

              {t("versions.createVersion", { n: versions.length + 1 })}

            </DropdownMenuItem>

          </>

        )}

      </DropdownMenuContent>

    </DropdownMenu>

  );

}

