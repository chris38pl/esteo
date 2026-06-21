import type { useTranslations } from "next-intl";
import type { ZodError } from "zod";

type CreateFormTranslator = ReturnType<typeof useTranslations<"workspaces.createForm">>;
type WorkspacesTranslator = ReturnType<typeof useTranslations<"workspaces">>;

export function resolveCreateWorkspaceZodError(
  error: ZodError,
  tForm: CreateFormTranslator,
  tWorkspaces: WorkspacesTranslator,
): string {
  const issue = error.issues[0];
  if (!issue) {
    return tWorkspaces("errors.generic");
  }

  const field = issue.path[0];

  if (field === "name") {
    if (issue.code === "too_small") {
      return tForm("errors.nameMin");
    }
    if (issue.code === "too_big") {
      return tForm("errors.nameMax");
    }
  }

  if (field === "industryOtherText") {
    if (issue.code === "too_small" || issue.code === "custom") {
      return tForm("errors.industryOtherMin");
    }
    if (issue.code === "too_big") {
      return tForm("errors.industryOtherMax");
    }
  }

  if (field === "industry" && issue.code === "custom") {
    return tForm("errors.industryNotAvailable");
  }

  if (field === "companyDescription" && issue.code === "too_big") {
    return tForm("errors.descriptionMax");
  }

  return tWorkspaces("errors.generic");
}

export function resolveCreateWorkspaceActionError(
  result: { error: string; code?: string },
  tForm: CreateFormTranslator,
  tWorkspaces: WorkspacesTranslator,
  options: { freeSlotCooldownDays: number; freeSlotDeleteLimit: number },
): string {
  if (result.code === "FREE_SLOT_COOLDOWN") {
    return tForm("errors.freeSlotCooldown", {
      days: options.freeSlotCooldownDays,
      limit: options.freeSlotDeleteLimit,
    });
  }

  if (result.code === "FREE_SLOT_ACTIVE" || result.code === "FREE_SLOT_TAKEN") {
    return tForm("freeTaken");
  }

  if (result.code === "GENERIC" || result.error === "Something went wrong.") {
    return tWorkspaces("errors.generic");
  }

  return result.error;
}
