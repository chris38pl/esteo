/** Maximum raw upload size per file (independent of workspace quota). */
export const MAX_SINGLE_FILE_BYTES = 20 * 1024 * 1024;

/** Abuse protection for a single upload action — not a workspace quota. */
export const MAX_FILES_PER_UPLOAD_BATCH = 20;

/** Default workspace attachment storage limit: 250 MB. */
export const DEFAULT_WORKSPACE_STORAGE_LIMIT_BYTES = 262144000;

export const MAX_IMAGE_WIDTH_PX = 2000;
export const THUMBNAIL_MAX_DIMENSION_PX = 300;

export const MAX_FILE_SIZE_MB = MAX_SINGLE_FILE_BYTES / (1024 * 1024);
