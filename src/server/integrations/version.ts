/** Public Integration API version embedded in `/api/v1/...` URLs. */
export const INTEGRATION_API_VERSION = "v1" as const;

/** Additive schema/document version returned by GET /schema. */
export const INTEGRATION_SCHEMA_VERSION = 1 as const;

export const INTEGRATION_API_SCOPE_REQUESTS_WRITE = "requests:write" as const;

export const DEFAULT_API_KEY_SCOPES = [INTEGRATION_API_SCOPE_REQUESTS_WRITE] as const;
