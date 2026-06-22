"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function CompanyProfileFieldLabel({
  htmlFor,
  icon: Icon,
  children,
}: {
  htmlFor?: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("size-3.5 shrink-0 text-primary")} aria-hidden />
      <Label htmlFor={htmlFor}>{children}</Label>
    </div>
  );
}
