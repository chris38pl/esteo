export const CLAIM_WINDOW_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isWithinClaimWindow(workspaceCreatedAt: Date, hasPaid: boolean): boolean {
  if (hasPaid) {
    return true;
  }
  return new Date() <= addDays(workspaceCreatedAt, CLAIM_WINDOW_DAYS);
}
