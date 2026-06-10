import { NextResponse } from "next/server";

import {
  uploadWorkspaceLogo,
  WorkspaceLogoError,
} from "@/features/workspaces/server/logo-service";
import { syncUserFromClerk } from "@/server/auth/sync-user";
import { PermissionError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const user = await syncUserFromClerk();

    if (!user) {
      return errorResponse("Unauthorized.", 401);
    }

    const formData = await request.formData();
    const workspaceId = formData.get("workspaceId");
    const fileEntry = formData.get("file");

    if (typeof workspaceId !== "string") {
      return errorResponse("Invalid request.", 400);
    }

    if (!(fileEntry instanceof File)) {
      return errorResponse("No file provided.", 400);
    }

    await requireRole(user, workspaceId, "OWNER");

    const result = await uploadWorkspaceLogo(user, workspaceId, fileEntry);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof WorkspaceLogoError) {
      const status =
        error.code === "FILE_TOO_LARGE"
          ? 413
          : error.code === "INVALID_TYPE"
            ? 400
            : 500;
      return errorResponse(error.message, status);
    }

    if (error instanceof PermissionError) {
      return errorResponse(error.message, 403);
    }

    console.error("[workspace logo upload]", error);
    return errorResponse("Upload failed.", 500);
  }
}
