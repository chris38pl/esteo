import { task, logger } from "@trigger.dev/sdk";

import { ESTIMATE_ACTIVITY_ACTIONS, logEstimateActivity } from "@/features/estimates/server/activity-log";
import {
  generateAndStoreEstimatePdf,
  sanitizeEstimatePdfErrorMessage,
} from "@/features/estimates/server/generate-and-store-estimate-pdf";
import { markEstimatePdfFailed } from "@/features/estimates/server/estimate-pdf-repository";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";

export interface GenerateEstimatePdfPayload {
  estimateId: string;
  versionId: string;
  workspaceId: string;
  locale: string;
  userId: string;
}

export const generateEstimatePdfTask = task({
  id: "generate-estimate-pdf",
  maxDuration: 120,
  retry: {
    maxAttempts: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 2,
  },
  run: async (payload: GenerateEstimatePdfPayload) => {
    const locale: Locale = isLocale(payload.locale) ? payload.locale : "pl";

    logger.info("Estimate PDF generation started", {
      estimateId: payload.estimateId,
      versionId: payload.versionId,
    });

    try {
      logger.info("Launching PDF browser", {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        nodeEnv: process.env.NODE_ENV,
      });

      const result = await generateAndStoreEstimatePdf({
        estimateId: payload.estimateId,
        versionId: payload.versionId,
        workspaceId: payload.workspaceId,
        locale,
        userId: payload.userId,
      });

      await logEstimateActivity({
        estimateId: payload.estimateId,
        workspaceId: payload.workspaceId,
        actorType: "USER",
        actorUserId: payload.userId,
        category: "SHARING",
        action: ESTIMATE_ACTIVITY_ACTIONS.estimate_exported,
        metadata: {
          format: "pdf",
          versionId: payload.versionId,
          estimatePdfId: result.estimatePdfId,
          cached: result.cached,
        },
      });

      logger.info("Estimate PDF generation completed", {
        estimateId: payload.estimateId,
        versionId: payload.versionId,
        estimatePdfId: result.estimatePdfId,
        cached: result.cached,
      });

      return result;
    } catch (error) {
      try {
        await markEstimatePdfFailed({
          versionId: payload.versionId,
          errorMessage: sanitizeEstimatePdfErrorMessage(error),
        });
      } catch (markError) {
        logger.error("Failed to mark estimate PDF as failed", {
          versionId: payload.versionId,
          error: markError,
        });
      }

      throw error;
    }
  },
});
