import { task, logger } from "@trigger.dev/sdk";

import { processEstimateSendAttempt } from "@/features/estimates/server/process-estimate-send-attempt";

export interface SendEstimateToCustomerPayload {
  sendId: string;
  activityNote?: string;
}

export const sendEstimateToCustomerTask = task({
  id: "send-estimate-to-customer",
  maxDuration: 180,
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: SendEstimateToCustomerPayload) => {
    logger.info("Estimate send started", { sendId: payload.sendId });

    await processEstimateSendAttempt(payload.sendId, payload.activityNote);

    logger.info("Estimate send completed", { sendId: payload.sendId });

    return { sendId: payload.sendId };
  },
});
