/** Rolling window for counting free-workspace create/delete cycles (anti-farming). */
export const FREE_WORKSPACE_COOLDOWN_DAYS = 30;

/** Max free workspaces an owner may delete within the rolling window before creation is blocked. */
export const FREE_WORKSPACE_MONTHLY_DELETE_LIMIT = 10;
