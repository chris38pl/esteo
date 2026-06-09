/**
 * Retries AI draft generation for incomplete estimates (zero sections on latest version).
 *
 * Usage:
 *   npx tsx scripts/retry-incomplete-ai-drafts.ts --dry-run
 *   npx tsx scripts/retry-incomplete-ai-drafts.ts --estimate-id=<id> --user-id=<clerkUserId>
 *   npx tsx scripts/retry-incomplete-ai-drafts.ts --workspace-id=<id> --limit=10 --force
 */
import { PrismaClient } from "@prisma/client";

import {
  canManualRetryAiDraft,
  computeEstimateDraftRecoveryFlags,
} from "../src/features/estimates/lib/estimate-generation-stale";
import { isIncompleteAiDraft } from "../src/features/estimates/lib/is-incomplete-ai-draft";
import { retryEstimateDraftGeneration } from "../src/features/estimates/server/retry-estimate-draft-generation";

const prisma = new PrismaClient();

function parseArgs(argv: string[]) {
  const options = {
    dryRun: false,
    force: false,
    workspaceId: undefined as string | undefined,
    estimateId: undefined as string | undefined,
    limit: undefined as number | undefined,
    userId: undefined as string | undefined,
    locale: "pl" as "pl" | "en",
  };

  for (const arg of argv) {
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg.startsWith("--workspace-id=")) {
      options.workspaceId = arg.slice("--workspace-id=".length);
    } else if (arg.startsWith("--estimate-id=")) {
      options.estimateId = arg.slice("--estimate-id=".length);
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number.parseInt(arg.slice("--limit=".length), 10);
    } else if (arg.startsWith("--user-id=")) {
      options.userId = arg.slice("--user-id=".length);
    } else if (arg.startsWith("--locale=")) {
      const locale = arg.slice("--locale=".length);
      if (locale === "pl" || locale === "en") {
        options.locale = locale;
      }
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.dryRun && !options.userId) {
    console.error("Provide --user-id=<id> for live retries, or use --dry-run.");
    process.exit(1);
  }

  const requests = await prisma.estimateRequest.findMany({
    where: {
      deletedAt: null,
      estimateId: { not: null },
      ...(options.workspaceId ? { workspaceId: options.workspaceId } : {}),
      ...(options.estimateId ? { estimate: { id: options.estimateId } } : {}),
    },
    select: {
      id: true,
      status: true,
      updatedAt: true,
      aiMetadata: true,
      estimate: {
        select: {
          id: true,
          workspaceId: true,
          latestVersion: {
            select: {
              id: true,
              status: true,
              _count: {
                select: {
                  sections: { where: { deletedAt: null } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "asc" },
    ...(options.limit != null ? { take: options.limit } : {}),
  });

  const candidates = requests.filter((request) => {
    const estimate = request.estimate;
    const latestVersion = estimate?.latestVersion;
    if (!estimate?.id || !latestVersion) {
      return false;
    }

    const sectionCount = latestVersion._count.sections;
    return isIncompleteAiDraft({
      hasEstimateRequest: true,
      sectionCount,
      versionStatus: latestVersion.status,
    });
  });

  console.log(
    `Found ${candidates.length} incomplete AI draft(s)${options.dryRun ? " (dry run)" : ""}.`,
  );

  if (candidates.length === 0) {
    return;
  }

  console.log("");
  console.log(
    ["estimateId", "requestId", "status", "retryCount", "canRetry", "action"].join("\t"),
  );

  let retried = 0;
  let skipped = 0;

  for (const request of candidates) {
    const estimate = request.estimate!;
    const latestVersion = estimate.latestVersion!;
    const sectionCount = latestVersion._count.sections;
    const recovery = computeEstimateDraftRecoveryFlags({
      hasEstimateRequest: true,
      status: request.status,
      sectionCount,
      versionStatus: latestVersion.status,
      updatedAt: request.updatedAt,
    });

    const metadata = (request.aiMetadata as Record<string, unknown> | null) ?? {};
    const retryCount =
      typeof metadata.retryCount === "number" ? metadata.retryCount : 0;

    const allowed = options.force || canManualRetryAiDraft({
      hasEstimateRequest: true,
      status: request.status,
      sectionCount,
      versionStatus: latestVersion.status,
      updatedAt: request.updatedAt,
    });

    let action = "skip";
    if (allowed) {
      action = options.dryRun ? "would-retry" : "retry";
    } else if (options.force) {
      action = options.dryRun ? "would-force-retry" : "force-retry";
    }

    console.log(
      [
        estimate.id,
        request.id,
        request.status,
        retryCount,
        recovery.canManualRetryAiDraft ? "yes" : "no",
        action,
      ].join("\t"),
    );

    if (options.dryRun || !allowed) {
      if (!allowed) {
        skipped += 1;
      }
      continue;
    }

    if (options.force && !recovery.canManualRetryAiDraft) {
      console.warn(`  [force] Retrying active generation for estimate ${estimate.id}`);
    }

    await retryEstimateDraftGeneration({
      estimateId: estimate.id,
      workspaceId: estimate.workspaceId,
      userId: options.userId!,
      locale: options.locale,
      force: options.force,
    });
    retried += 1;
  }

  console.log("");
  if (options.dryRun) {
    console.log(`Dry run complete. ${candidates.length} candidate(s) listed.`);
  } else {
    console.log(`Done. Retried: ${retried}, skipped (active): ${skipped}.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
