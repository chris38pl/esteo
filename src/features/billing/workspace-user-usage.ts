/** Billing "Users" includes the owner; entitlements.seats track invited seats only. */
export function workspaceUserUsage(seats: {
  used: number;
  reserved: number;
  limit: number | null;
}): { used: number; limit: number | null } {
  const invitedOccupied = seats.used + seats.reserved;
  return {
    used: invitedOccupied + 1,
    limit: seats.limit === null ? null : seats.limit + 1,
  };
}
