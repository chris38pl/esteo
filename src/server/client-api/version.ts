/**
 * Client API versioning.
 *
 * `apiVersion` / `dtoVersion` are the contract version surfaced to clients via
 * `bootstrap()`. They follow the never-breaking rule: within a version we only
 * add fields. `serverVersion` is the deployed build for diagnostics.
 */
export const API_VERSION = "v1" as const;
export const DTO_VERSION = "v1" as const;
export const SERVER_VERSION = process.env.APP_VERSION ?? "0.1.0";
