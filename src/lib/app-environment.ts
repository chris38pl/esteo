import type { IssueEnvironment } from "@prisma/client";

export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export function resolveIssueEnvironment(): IssueEnvironment {
  if (process.env.VERCEL_ENV === "preview") {
    return "PREVIEW";
  }

  if (process.env.VERCEL_ENV === "production") {
    return "PRODUCTION";
  }

  return "LOCALHOST";
}
