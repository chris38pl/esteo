export class DevBillingToolkitDisabledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DevBillingToolkitDisabledError";
  }
}

/** Blocks CLI toolkit when running in Vercel Production. */
export function assertDevBillingCliEnabled(): void {
  if (process.env.VERCEL_ENV === "production") {
    throw new DevBillingToolkitDisabledError(
      "Dev billing CLI is disabled in Vercel Production (VERCEL_ENV=production).",
    );
  }
}

/** Blocks optional /dev/billing UI unless explicitly enabled outside Production. */
export function assertDevBillingUiEnabled(): void {
  assertDevBillingCliEnabled();

  if (process.env.ENABLE_DEV_BILLING_TOOLS !== "true") {
    throw new DevBillingToolkitDisabledError(
      "Dev billing UI requires ENABLE_DEV_BILLING_TOOLS=true.",
    );
  }
}
