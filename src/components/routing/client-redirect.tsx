"use client";

import { useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** Reliable redirect during client navigations when server `redirect()` can stall RSC. */
export function ClientRedirect({ href }: { href: string }) {
  const router = useRouter();
  const hasRedirected = useRef(false);

  useLayoutEffect(() => {
    if (hasRedirected.current) return;
    hasRedirected.current = true;
    router.replace(href);
  }, [href, router]);

  return null;
}
