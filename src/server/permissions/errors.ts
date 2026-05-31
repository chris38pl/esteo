export class PermissionError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionError";
  }
}

export class EntitlementError extends Error {
  code?: string;

  constructor(message = "Plan limit reached", code?: string) {
    super(message);
    this.name = "EntitlementError";
    this.code = code;
  }
}

export class WorkspaceError extends Error {
  constructor(message = "Workspace error") {
    super(message);
    this.name = "WorkspaceError";
  }
}
