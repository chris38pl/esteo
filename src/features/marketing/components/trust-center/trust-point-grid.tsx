import { CreditCard, FolderOpen, HardDrive, Lock, Shield, Sparkles, type LucideIcon } from "lucide-react";

import type { TrustPoint } from "@/features/marketing/components/trust-center/trust-types";
import { TrustIconShell } from "@/features/marketing/components/trust-center/trust-icon-shell";
import { cn } from "@/lib/utils";

const pointIcons: Record<string, LucideIcon> = {
  auth: Shield,
  billing: CreditCard,
  workspace: FolderOpen,
  ai: Sparkles,
  https: Lock,
  backups: HardDrive,
};

export function TrustPointGrid({ points }: { points: TrustPoint[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {points.map((point) => {
        const Icon = pointIcons[point.id] ?? Shield;

        return (
          <article
            key={point.id}
            className={cn(
              "flex h-full flex-col rounded-xl border border-border/45 bg-card/35 px-6 py-8 sm:items-center sm:px-6 sm:py-10 sm:text-center",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
            )}
          >
            <div className="flex items-center gap-3 sm:hidden">
              <TrustIconShell Icon={Icon} />
              <h3 className="text-sm font-semibold leading-snug text-foreground">{point.title}</h3>
            </div>

            <TrustIconShell Icon={Icon} size="lg" className="hidden sm:grid" />

            <h3 className="mt-5 hidden text-sm font-semibold leading-snug text-foreground sm:block sm:text-[0.9375rem]">
              {point.title}
            </h3>

            <p className="mt-3 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-[13px] sm:leading-6">
              {point.description}
            </p>
          </article>
        );
      })}
    </div>
  );
}
