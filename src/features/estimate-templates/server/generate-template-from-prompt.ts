import "server-only";

import { generateEstimateTemplate } from "@/ai/services/generate-estimate-template";
import { normalizeTemplateGenerationOutput } from "@/ai/lib/normalize-template-generation-output";
import type { TemplateGenerationMode } from "@/ai/prompts/template-generation";
import type { TemplateEditorDraft } from "@/features/estimate-templates/lib/template-editor-draft";
import { getConfigurationAccess } from "@/features/workspace-configuration/server/service";
import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";
import type { User } from "@prisma/client";
import {
  assertCanUseAiAssistant,
  incrementAiAssistantUsage,
} from "@/server/permissions/entitlements";
import { EntitlementError, WorkspaceError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

const MIN_OUTLINE_LENGTH = 20;
const MAX_OUTLINE_LENGTH = 12_000;

export class TemplateGenerationError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_INPUT" | "WORKSPACE_NOT_FOUND" | "GENERATION_FAILED",
  ) {
    super(message);
    this.name = "TemplateGenerationError";
  }
}

export async function generateTemplateFromPrompt(input: {
  user: User;
  workspaceId: string;
  userOutline: string;
  generationMode: TemplateGenerationMode;
  locale: Locale;
}): Promise<TemplateEditorDraft> {
  await requireRole(input.user, input.workspaceId, "OWNER");

  const access = await getConfigurationAccess(input.workspaceId);
  if (!access.canEditPremiumConfiguration) {
    throw new EntitlementError(
      "Szablony są dostępne w planach Pro i Business.",
      access.reason ?? "FEATURE_DISABLED",
    );
  }

  await assertCanUseAiAssistant(input.workspaceId);

  const outline = input.userOutline.trim();
  if (outline.length < MIN_OUTLINE_LENGTH) {
    throw new TemplateGenerationError(
      "Outline is too short.",
      "INVALID_INPUT",
    );
  }
  if (outline.length > MAX_OUTLINE_LENGTH) {
    throw new TemplateGenerationError(
      "Outline is too long.",
      "INVALID_INPUT",
    );
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: input.workspaceId, deletedAt: null },
    include: { settings: true },
  });

  if (!workspace) {
    throw new WorkspaceError("Workspace nie został znaleziony.");
  }

  try {
    const output = await generateEstimateTemplate({
      userOutline: outline,
      locale: input.locale,
      industry: workspace.industry,
      industryOtherText: workspace.industryOtherText,
      companyDescription: workspace.settings?.companyDescription ?? null,
      aiInstructions: workspace.settings?.aiInstructions ?? null,
      generationMode: input.generationMode,
    });

    const draft = normalizeTemplateGenerationOutput(output);
    await incrementAiAssistantUsage(input.workspaceId, input.user.id);
    return draft;
  } catch (error) {
    if (error instanceof TemplateGenerationError || error instanceof WorkspaceError) {
      throw error;
    }
    console.error("[generateTemplateFromPrompt]", error);
    throw new TemplateGenerationError(
      "Template generation failed.",
      "GENERATION_FAILED",
    );
  }
}
