export type WorkspaceBillingPermissions = {
  canViewBilling: boolean;
  canManageBilling: boolean;
  billingHandoffActive: boolean;
  payerUserId: string;
  ownerId: string;
  isBillingPayer: boolean;
};

export type BillingPayerWorkspace = {
  id: string;
  name: string;
  slug: string;
};

export function resolveEffectivePayerUserId(
  payerUserId: string | null | undefined,
  workspaceOwnerId: string,
): string {
  return payerUserId ?? workspaceOwnerId;
}

/** Pure evaluation — used by server helpers and verify script. */
export function evaluateWorkspaceBillingPermissions(input: {
  userId: string;
  workspaceOwnerId: string;
  payerUserId: string;
  isActiveMember: boolean;
}): WorkspaceBillingPermissions {
  const isBillingPayer = input.userId === input.payerUserId;
  const isOwnerMember = input.workspaceOwnerId === input.userId && input.isActiveMember;
  const billingHandoffActive = input.payerUserId !== input.workspaceOwnerId;

  return {
    canViewBilling: isBillingPayer || isOwnerMember,
    canManageBilling: isBillingPayer,
    billingHandoffActive,
    payerUs