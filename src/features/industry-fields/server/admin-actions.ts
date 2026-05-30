"use server";

import { revalidatePath } from "next/cache";

import {
  createFieldDefinitionSchema,
  listFieldDefinitionsFilterSchema,
  updateFieldDefinitionSchema,
} from "@/features/industry-fields/schemas/definition";
import {
  createFieldDefinitionRecord,
  listFieldDefinitions,
  updateFieldDefinitionRecord,
} from "@/features/industry-fields/server/repository";
import type { Locale } from "@/lib/locale";
import { requireAuth } from "@/server/auth/require-auth";
import { assertPlatformAdminAccess } from "@/server/auth/require-platform-admin";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function toActionError(error: unknown): ActionResult<never> {
  console.error(error);
  return { success: false, error: error instanceof Error ? error.message : "Something went wrong." };
}

export async function listIndustryFieldDefinitionsAction(
  input: { industry: string; documentType: string },
  locale: Locale = "pl",
) {
  try {
    await assertPlatformAdminAccess(locale);
    const parsed = listFieldDefinitionsFilterSchema.parse(input);
    const definitions = await listFieldDefinitions(parsed);
    return { success: true as const, data: definitions };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createIndustryFieldDefinitionAction(
  input: unknown,
  locale: Locale = "pl",
) {
  try {
    await assertPlatformAdminAccess(locale);
    const parsed = createFieldDefinitionSchema.parse(input);
    const definition = await createFieldDefinitionRecord(parsed);
    revalidatePath(`/${locale}/dashboard/admin/industry-fields`);
    return { success: true as const, data: definition };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateIndustryFieldDefinitionAction(
  input: unknown,
  locale: Locale = "pl",
) {
  try {
    await assertPlatformAdminAccess(locale);
    const parsed = updateFieldDefinitionSchema.parse(input);
    const definition = await updateFieldDefinitionRecord(parsed);
    revalidatePath(`/${locale}/dashboard/admin/industry-fields`);
    return { success: true as const, data: definition };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getIndustryFieldsAdminContextAction(locale: Locale = "pl") {
  try {
    await requireAuth(locale);
    await assertPlatformAdminAccess(locale);
    return { success: true as const, data: { isAdmin: true } };
  } catch (error) {
    return toActionError(error);
  }
}
