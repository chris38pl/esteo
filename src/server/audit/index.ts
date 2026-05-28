export { logAuditEvent } from "@/features/workspaces/server/repository";

export type AuditLogInput = {
  actorUserId: string;
  workspaceId?: string;
  entityType: string;
  entityId: string;
  action: string;
  diff?: Record<string, unknown>;
};
