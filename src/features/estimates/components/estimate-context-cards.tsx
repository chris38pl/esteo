"use client";

import { Calendar, Hash, User } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EstimateRequestStatus } from "@prisma/client";

interface EstimateContextCardsProps {
  requestNumber?: string | null;
  requestStatus?: EstimateRequestStatus | null;
  customerName?: string | null;
  customerEmail?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

const requestStatusVariant: Record<
  EstimateRequestStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PENDING: "secondary",
  PROCESSING: "default",
  COMPLETED: "outline",
  FAILED: "destructive",
};

export function EstimateContextCards({
  requestNumber,
  requestStatus,
  customerName,
  customerEmail,
  createdAt,
  updatedAt,
}: EstimateContextCardsProps) {
  const t = useTranslations("estimates");

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {requestNumber && (
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Hash className="size-3" />
            {t("context.request")}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{requestNumber}</span>
            {requestStatus && (
              <Badge variant={requestStatusVariant[requestStatus]} className="text-xs">
                {t(`requestStatus.${requestStatus}`)}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {(customerName ?? customerEmail) && (
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <User className="size-3" />
            {t("context.client")}
          </div>
          <div className="text-sm font-medium truncate">{customerName ?? customerEmail}</div>
          {customerName && customerEmail && (
            <div className="text-xs text-muted-foreground truncate">{customerEmail}</div>
          )}
        </Card>
      )}

      {createdAt && (
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Calendar className="size-3" />
            {t("context.created")}
          </div>
          <div className="text-sm font-medium">
            {new Date(createdAt).toLocaleDateString()}
          </div>
        </Card>
      )}

      {updatedAt && (
        <Card className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Calendar className="size-3" />
            {t("context.lastUpdated")}
          </div>
          <div className="text-sm font-medium">
            {new Date(updatedAt).toLocaleDateString()}
          </div>
        </Card>
      )}
    </div>
  );
}
