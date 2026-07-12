import { Prisma } from "@prisma/client";
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import type { TRPCContext } from "@/server/trpc/context";

/**
 * superjson transformers.
 *
 * `Date` and `BigInt` are handled natively by superjson. Prisma `Decimal`
 * is registered explicitly so money values survive the wire even if a mapper
 * ever forwards one directly (mappers normally convert Decimal -> number).
 */
superjson.registerCustom<Prisma.Decimal, string>(
  {
    isApplicable: (value): value is Prisma.Decimal =>
      Prisma.Decimal.isDecimal(value),
    serialize: (value) => value.toString(),
    deserialize: (value) => new Prisma.Decimal(value),
  },
  "prisma.Decimal",
);

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;
export const baseProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
