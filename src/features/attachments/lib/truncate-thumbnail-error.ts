const DEFAULT_MAX_ERROR_LENGTH = 1000;
export function truncateThumbnailGenerationError(
  message: string,
  maxLength = DEFAULT_MAX_ERROR_LENGTH,
): string {
  if (message.length <= maxLength) {
    return message;
  }

  return `${message.slice(0, maxLength - 3)}...`;
}
