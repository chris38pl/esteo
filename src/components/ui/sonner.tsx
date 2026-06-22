"use client";

import { useTheme } from "@teispace/next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme === "light" ? "light" : "dark"}
      className="toaster group"
      closeButton={false}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group toast group-[.toaster]:!z-[90] group-[.toaster]:!border-0 group-[.toaster]:!bg-transparent group-[.toaster]:!p-0 group-[.toaster]:!shadow-none",
        },
      }}
      {...props}
    />
  );
}
