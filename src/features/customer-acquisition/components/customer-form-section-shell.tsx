import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
};

export function CustomerFormSectionShell({ icon: Icon, title, children, className }: Props) {
  return (
    <section className={cn("rounded-xl border border-border/60 p-4", className)}>
      <div className="flex items-center gap-2">
        <Icon className="size-4 shrink-0 text-primary/80" strokeWidth={2} aria-hidden />
        <p className="text-sm font-medium text-foreground">{title}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
