import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function WorkspaceSettingsCard({
  title,
  children,
  className,
  contentClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardHeader className="border-b px-6 py-4 [.border-b]:pb-4">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-6 px-6 pb-6 pt-4", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
