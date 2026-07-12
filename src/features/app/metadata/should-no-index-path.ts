/** Paths that should receive X-Robots-Tag: noindex, nofollow (not /api). */
export function shouldNoIndexPath(pathname: string): boolean {
  if (pathname.includes("/api/")) {
    return false;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    return false;
  }

  const section = segments[1];

  if (section === "sign-in" || section === "sign-up") {
    return true;
  }

  if (section !== "dashboard") {
    return false;
  }

  const dashboardSegment = segments[2];
  if (dashboardSegment === "onboarding") {
    return true;
  }

  return true;
}
