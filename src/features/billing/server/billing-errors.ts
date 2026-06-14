export class BillingError extends Error {
  readonly code: string;

  constructor(
    message = "Billing operation failed. Please try again from billing settings or contact support.",
    code = "BILLING_ERROR",
  ) {
    super(message);
    this.name = "BillingError";
    this.code = code;
  }
}

export class BillingPlanResolutionError extends BillingError {
  constructor(message: string) {
    super(message, "BILLING_PLAN_RESOLUTION_FAILED");
    this.name = "BillingPlanResolutionError";
  }
}
