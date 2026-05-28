"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

function initials(name: string) {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  const a = tokens[0]?.[0] ?? "";
  const b = tokens.length > 1 ? tokens[tokens.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase() || "W";
}

export function WorkspaceAvatar({
  name,
  logoUrl,
  size = 36,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const hasLogo = Boolean(logoUrl?.trim());
  const label = initials(name);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
        "ring-1 ring-border/55",
        "bg-gradient-to-br from-primary/14 via-card/40 to-transparent",
        "text-[12px] font-semibold text-foreground/90",
        "transition-[transform,box-shadow] duration-200",
        "group-hover:scale-[1.02] group-hover:ring-border/70",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {hasLogo ? (
        <Image
          src={logoUrl!}
          alt=""
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{label}</span>
      )}
    </span>
  );
}

