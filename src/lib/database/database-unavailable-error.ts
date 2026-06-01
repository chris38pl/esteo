export const DATABASE_UNAVAILABLE_CODE = "DATABASE_UNAVAILABLE" as const;

const DEFAULT_MESSAGE =
  "Database is temporarily unavailable or waking from sleep. Please retry in a few seconds.";

export class DatabaseUnavailableError extends Error {
  readonly code = DATABASE_UNAVAILABLE_CODE;

  constructor(message: string = DEFAULT_MESSAGE) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}
