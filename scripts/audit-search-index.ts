/**
 * Reports Estimate vs SearchDocument index drift per workspace.
 *
 *   npm run audit:search-index
 *   npm run audit:search-index:staging
 *   npm run audit:search-index:staging -- --estimate=rv8u0ojm1dvvvdkaiibd90kp
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: ".env.local" });
config({ path: ".env" });

const useStaging = process.argv.includes("--staging");

if (useStaging) {
  const databaseUrl = process.env.DATABASE_URL_STAGING;
  const directUrl = process.env.DIRECT_URL_STAGING;

  if (!databaseUrl) {
    console.error("Missing DATABASE_URL_STAGING in .env / .env.local.");
    process.exit(1);
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.DIRECT_URL = directUrl ?? databaseUrl;
}

const prisma = new PrismaClient();

function readArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

async function main() {
  const estimateId = readArg("estimate");
  const workspaceSlug = readArg("workspace") ?? "firma-juniora";

  const workspace = await prisma.workspace.findFirst({
    where: { slug: workspaceSlug, deletedAt: null },
    select: { id: true, slug: true, name: true },
  });

  if (!workspace) {
    console.log(JSON.stringify({ status: "WORKSPACE_NOT_FOUND", workspaceSlug }, null, 2));
    return;
  }

  const missingIndex = await prisma.$queryRaw<
    Array<{ id: string; title: string | null; createdAt: Date }>
  >`
    SELECT e.id, e.title, e."createdAt"
    FROM "Estimate" e
    LEFT JOIN "SearchDocument" sd
      ON sd."entityId" = e.id
      AND sd."entityType" = 'ESTIMATE'
      AND sd."deletedAt" IS NULL
    WHERE e."workspaceId" = ${workspace.id}
      AND e."deletedAt" IS NULL
      AND sd.id IS NULL
    ORDER BY e."createdAt" ASC
  `;

  const [estimateCount, indexedCount] = await Promise.all([
    prisma.estimate.count({
      where: { workspaceId: workspace.id, deletedAt: null },
    }),
    prisma.searchDocument.count({
      where: {
        workspaceId: workspace.id,
        entityType: "ESTIMATE",
        deletedAt: null,
      },
    }),
  ]);

  let targetDocument: {
    entityId: string;
    title: string;
    searchText: string;
  } | null = null;

  if (estimateId) {
    targetDocument = await prisma.searchDocument.findFirst({
      where: {
        workspaceId: workspace.id,
        entityType: "ESTIMATE",
        entityId: estimateId,
        deletedAt: null,
      },
      select: {
        entityId: true,
        title: true,
        searchText: true,
      },
    });
  }

  console.log(
    JSON.stringify(
      {
        workspace: workspace.slug,
        workspaceId: workspace.id,
        estimateCount,
        indexedEstimateCount: indexedCount,
        missingIndexCount: missingIndex.length,
        missingIndexSample: missingIndex.slice(0, 10).map((row) => ({
          id: row.id,
          title: row.title,
          createdAt: row.createdAt.toISOString(),
        })),
        targetEstimateId: estimateId ?? null,
        targetIndexed: estimateId ? targetDocument != null : null,
        targetDocument,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
