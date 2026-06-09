export function isPersistedEntityId(id: string | undefined): id is string {
  return typeof id === "string" && id.length > 0 && !id.startsWith("temp-");
}
