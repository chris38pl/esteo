import type { IssueDeviceType } from "@prisma/client";

export function resolveDeviceType(width: number): IssueDeviceType {
  if (width < 768) {
    return "MOBILE";
  }

  if (width < 1024) {
    return "TABLET";
  }

  return "DESKTOP";
}
