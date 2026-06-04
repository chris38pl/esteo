"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EstimateVersionStatus, EstimateRequestStatus } from "@prisma/client";
import { CreateEstimateModal } from "./create-estimate-modal";
import type { PublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import type { Locale } from "@/lib/locale";

interface EstimateListItem {
  id: string;
  title: string | null;
  currency: string;
  createdAt: Date;
  latestVersion: {
    id: string;
    versionNumber: number;
    status: EstimateVersionStatus;
    updatedAt: Date;
  } | null;
  estimateRequest: {
    id: string;
    requestNumber: string | null;
    status: EstimateRequestStatus;
    createdAt: Date;
  } | null;
  _count: { versions: number };
}

interface EstimatesListPanelProps {
  estimates: EstimateListItem[];
  createFormData: PublicEstimateRequestPageData;
  workspaceId: string;
  workspaceSlug: string;
  locale: Locale;
}

const versionStatusVariant: Record<
  EstimateVersionStatus,
  "default" | "secondary" | "outline"
> = {
  DRAFT: "secondary",
  SENT: "default",
  ARCHIVED: "outline",
};

const versionStatusLabel: Record<EstimateVersionStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ARCHIVED: "Archived",
};

const requestStatusVariant: Record<
  EstimateRequestStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  PROCESSING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
};

export function EstimatesListPanel({
  estimates,
  createFormData,
  workspaceId,
  workspaceSlug,
  locale,
}: EstimatesListPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Estimates</h1>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="size-4" />
          New estimate
        </Button>
      </div>

      {estimates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-sm">No estimates yet.</p>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            Create your first estimate
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Estimate</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Request</th>
                <th className="px-4 py-3 text-left font-medium">Versions</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {estimates.map((estimate) => (
                <tr
                  key={estimate.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/${locale}/dashboard/${workspaceSlug}/estimates/${estimate.id}`}
                      className="font-medium hover:text-primary hover:underline underline-offset-4"
                    >
                      {estimate.title ?? `Estimate ${estimate.id.slice(-6)}`}
                    </Link>
                    {estimate.estimateRequest?.requestNumber && (
                      <p className="text-xs text-muted-foreground">
                        {estimate.estimateRequest.requestNumber}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {estimate.latestVersion ? (
                      <Badge variant={versionStatusVariant[estimate.latestVersion.status]}>
                        {versionStatusLabel[estimate.latestVersion.status]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {estimate.estimateRequest ? (
                      <Badge
                        variant={requestStatusVariant[estimate.estimateRequest.status]}
                        className="text-xs"
                      >
                        {estimate.estimateRequest.status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    v{estimate.latestVersion?.versionNumber ?? 1}
                    {estimate._count.versions > 1 && (
                      <span className="text-xs ml-1">({estimate._count.versions} total)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {estimate.latestVersion
                      ? new Date(estimate.latestVersion.updatedAt).toLocaleDateString()
                      : new Date(estimate.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateEstimateModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        formData={createFormData}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        locale={locale}
      />
    </div>
  );
}
