import { TRPCError } from "@trpc/server";

import { baseProcedure, middleware } from "@/server/trpc/init";
import {
  EntitlementError,
  PermissionError,
  WorkspaceError,
} from "@/server/permissions/errors";

/**
 * Transport-level error mapping.
 *
 * This is the ONLY domain awareness allowed in the tRPC layer: it translates
 * domain errors thrown by the service layer into tRPC error codes. It does not
 * contain business logic.
 */
const mapDomainErrors = middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof PermissionError) {
      throw new TRPCError({ code: "FORBIDDEN", message: error.message, cause: error });
    }
    if (error instanceof EntitlementError) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: error.message,
        cause: error,
      });
    }
    if (error instanceof WorkspaceError) {
      throw new TRPCError({ code: "NOT_FOUND", message: error.message, cause: error });
    }
    throw error;
  }
});

const requireUser = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const publicProcedure = baseProcedure.use(mapDomainErrors);

export const protectedProcedure = publicProcedure.use(requireUser);
