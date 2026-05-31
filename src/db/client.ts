import { PrismaClient } from "@prisma/client";

/** Bump when Prisma schema changes so dev HMR does not keep a stale client. */
const PRISMA_CLIENT_CACHE_KEY = "prisma-client-v2-appearance-theme";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientCacheKey?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const cached =
  globalForPrisma.prismaClientCacheKey === PRISMA_CLIENT_CACHE_KEY
    ? globalForPrisma.prisma
    : undefined;

export const prisma = cached ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaClientCacheKey = PRISMA_CLIENT_CACHE_KEY;
}
