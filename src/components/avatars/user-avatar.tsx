"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

export type AvatarPreset =
  | "accountant"
  | "architect"
  | "carpenter"
  | "constructor"
  | "electrician"
  | "engineer";

function presetSrc(preset: AvatarPreset) {
  return `/avatars/${preset}.png`;
}

export function UserAvatar({
  imageUrl,
  avatarPreset,
  size = 36,
  className,
}: {
  imageUrl?: string | null;
  avatarPreset?: AvatarPreset | null;
  size?: number;
  className?: string;
}) {
  const src = imageUrl?.trim()
    ? imageUrl
    : avatarPreset
      ? presetSrc(avatarPreset)
      : presetSrc("architect");

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        "ring-1 ring-border/55",
        "transition-[transform,box-shadow] duration-200",
        "group-hover:scale-[1.02] group-hover:ring-border/70",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}

