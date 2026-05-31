"use client";

import { useLayoutEffect } from "react";
import { useRouter } from "next/navigation";

/** Reliable redirect during client navigations when server `redirect()` can stall RSC. */
export function ClientRedirect({ href }: { href: string }) {
  const router = useRouter();

  useLayoutEffect(() => {
    router.replace(href);
  }, [href, router]);

  return null;
}
