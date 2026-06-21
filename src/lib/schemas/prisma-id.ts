import { isCuid as isCuid2 } from "@paralleldrive/cuid2";
import { z } from "zod";

const cuidV1Schema = z.string().cuid();

/** Accepts Prisma `@default(cuid())` ids and `@paralleldrive/cuid2` ids from app code. */
export function isPrismaEntityId(value: string): boolean {
  return cuidV1Schema.safeParse(value).success || isCuid2(value);
}

export const prismaEntityIdSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isPrismaEntityId, "Invalid entity id.");
