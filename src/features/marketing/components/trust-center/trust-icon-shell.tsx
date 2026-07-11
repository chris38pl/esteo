import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const trustIconShellClassName = cn(
  "grid shrink-0 place-items-center rounded-2xl",
  "bg-[radial-gradient(circle_at_50%_32%,rgba(59,130,246,0.22),rgba(30,64,175,0.08)_58%,transparent_100%)]",
);

type TrustIconShellProps = {
  Icon: LucideIcon;
  size?: "sm" | "lg";
  className?: string;
};

export function TrustIconShell({ Icon, size = "sm", className }: TrustIconShellProps) {
  if (size === "lg") {
    return (
      <span className={cn(trustIconShellClassName, "size-[5.2rem]", className)}>
        <Icon className="size-[2.6rem] text-primary" strokeWidth={1.25} aria-hidden />
      </span>
    );
  }

  return (
    <span className={cn(trustIconShellClassName, "size-11", className)}>
      <Icon className="size-5 text-primary" strokeWidth={1.25} aria-hidden />
    </span>
  );
}
