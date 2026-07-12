import { createCallerFactory, router } from "@/server/trpc/init";
import { accountRouter } from "@/server/client-api/routers/account";
import { bootstrapProcedure } from "@/server/client-api/routers/bootstrap";
import { dashboardRouter } from "@/server/client-api/routers/dashboard";
import { estimateRouter } from "@/server/client-api/routers/estimate";
import { inboxRouter } from "@/server/client-api/routers/inbox";
import { requestRouter } from "@/server/client-api/routers/request";
import { workspaceRouter } from "@/server/client-api/routers/workspace";

/**
 * Root Client API router (v1).
 *
 * Use-case oriented (not a 1:1 mirror of the backend). Endpoints never call
 * each other; each goes endpoint -> service -> mapper -> DTO.
 */
export const clientRouter = router({
  bootstrap: bootstrapProcedure,
  dashboard: dashboardRouter,
  workspace: workspaceRouter,
  estimate: estimateRouter,
  request: requestRouter,
  inbox: inboxRouter,
  account: accountRouter,
});

export type ClientRouter = typeof clientRouter;

export const createClientCaller = createCallerFactory(clientRouter);
