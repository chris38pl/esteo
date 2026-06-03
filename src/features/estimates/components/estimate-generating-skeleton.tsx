"use client";



import { useRouter } from "next/navigation";

import { useTranslations } from "next-intl";



import { cn } from "@/lib/utils";

import { useGenerationPolling } from "@/features/estimates/hooks/use-generation-polling";

import type { Locale } from "@/lib/locale";



interface EstimateGeneratingSkeletonProps {

  estimateId: string;

  workspaceSlug: string;

  locale: Locale;

  initialStatus?: string | null;

}



export function EstimateGeneratingSkeleton({

  estimateId,

  workspaceSlug,

  locale,

  initialStatus,

}: EstimateGeneratingSkeletonProps) {

  const t = useTranslations("estimates");

  const router = useRouter();



  const { status, timedOut } = useGenerationPolling({

    estimateId,

    initialStatus: (initialStatus ?? "PENDING") as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED",

    locale,

    onFinished: (finalStatus) => {

      if (finalStatus === "COMPLETED") {

        router.refresh();

      }

    },

  });



  if (timedOut) {

    return (

      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">

        <p className="text-muted-foreground text-sm">{t("editor.generatingTimeout")}</p>

        <button

          onClick={() => router.refresh()}

          className="text-sm text-primary underline-offset-4 hover:underline"

        >

          {t("editor.refreshStatus")}

        </button>

      </div>

    );

  }



  if (status === "FAILED") {

    return (

      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-12 text-center">

        <p className="text-destructive text-sm font-medium">{t("editor.generatingFailed")}</p>

        <p className="text-muted-foreground text-xs">{t("editor.generatingFailedHint")}</p>

      </div>

    );

  }



  return (

    <div className="space-y-4">

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

