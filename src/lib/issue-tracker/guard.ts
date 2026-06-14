export class IssueTrackerDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IssueTrackerDisabledError";
  }
}

export function isIssueTrackerEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }

  return process.env.ENABLE_ISSUE_TRACKER === "true";
}

export function assertIssueTrackerEnabled(): void {
  if (process.env.VERCEL_ENV === "production") {
    throw new IssueTrackerDisabledError(
      "Issue tracker is disabled in Vercel Production (VERCEL_ENV=production).",
    );
  }

  if (process.env.ENABLE_ISSUE_TRACKER !== "true") {
    throw new IssueTrackerDisabledError(
      "Issue tracker requires ENABLE_ISSUE_TRACKER=true.",
    );
  }
}
