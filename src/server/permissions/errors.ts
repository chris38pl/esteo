export class PermissionError extends Error {
  constructor(message = "Permission denied") {
    super(message);
    this.name = "PermissionError";
  }
}

export class EntitlementError extends Error {
  constructor(message = "Plan limit reached") {
    super(message);
    this.name = "EntitlementError";
  }
}

export class WorkspaceError extends Error {
  constructor(message = "Workspace error") {
    super(message);
    this.name = "WorkspaceError";
  }
}
