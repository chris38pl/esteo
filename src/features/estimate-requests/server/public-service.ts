import { BusinessDocumentType, type WorkspaceIndustry } from "@prisma/client";

import { prisma } from "@/db/client";
import { getIndustryFieldsForDocument, type IndustryFieldForDocument } from "@/features/industry-fields/server/get-fields-for-workspace";
import { submitEstimateRequestWithAttachments } from "@/features/estimate-requests/server/submit-estimate-request-with-attachments";
import type { PublicEstimateRequestInput } from "@/features/estimate-requests/schemas/request";
import type { PublicAttachmentAvailability } from "@/features/attachments/lib/attachment-availability";
import { getPublicAttachmentAvailability } from "@/features/attachments/server/public-attachment-availability";
import {
  getClientPortalAccess,
  type ClientPortalAccess,
} from "@/server/billing/client-portal-access";
import { resolvePublicWorkspaceBySlug } from "@/server/workspaces/resolve-public-slug";
import type { Locale } from "@/lib/locale";

export type PublicEstimateRequestWorkspace = {
  id: string;
  name: string;
  slug: string;
  industry: WorkspaceIndustry;
};

export type PublicEstimateRequestPageData = {
  workspace: PublicEstimateRequestWorkspace;
  fields: IndustryFieldForDocument[];
  attachmentAvailability: PublicAttachmentAvailability;
  portalAccess: ClientPortalAccess;
  canonicalSlug: string;
  matchedViaAlias: boolean;
};

export async function getPublicEstimateRequestPageData(input: {
  workspaceSlug: string;
  locale: Locale;
}): Promise<PublicEstimateRequestPageData | null> {
  const resolved = await resolvePublicWorkspaceBySlug(input.workspaceSlug);

  if (!resolved) {
    return null;
  }

  const portalAccess = await getClientPortalAccess(resolved.workspaceId);
  if (portalAccess === "INACTIVE") {
    return null;
  }

  const workspace = await prisma.workspace.findFirst({
    where: {
      id: resolved.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
    },
  });

  if (!workspace) {
    return null;
  }

  const fields = await getIndustryFieldsForDocument({
    workspaceId: workspace.id,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    locale: input.locale,
  });

  const attachmentAvailability = await getPublicAttachmentAvailability(workspace.id);

  return {
    workspace,
    fields,
    attachmentAvailability,
    portalAccess,
    canonicalSlug: resolved.canonicalSlug,
    matchedViaAlias: resolved.matchedViaAlias,
  };
}

export async function getEstimateRequestFormDataForWorkspace(input: {
  workspaceId: string;
  locale: Locale;
}): Promise<PublicEstimateRequestPageData | null> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: input.workspaceId,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      industry: true,
    },
  });

  if (!workspace) {
    return null;
  }

  const fields = await getIndustryFieldsForDocument({
    workspaceId: workspace.id,
    documentType: BusinessDocumentType.ESTIMATE_REQUEST,
    locale: input.locale,
  });

  const attachmentAvailability = await getPublicAttachmentAvailability(workspace.id);
  const portalAccess = await getClientPortalAccess(workspace.id);

  return {
    workspace,
    fields,
    attachmentAvailability,
    portalAccess,
    canonicalSlug: workspace.slug,
    matchedViaAlias: false,
  };
}

export async function createPublicEstimateRequest(input: {
  locale: Locale;
  payload: PublicEstimateRequestInput;
  requestMeta: {
    ip: string;
    userAgent: string;
  };
}) {
  const { customer, address, project, industryFields, workspaceSlug } = input.payload;

  const result = await submitEstimateRequestWithAttachments({
    locale: input.locale,
    source: "PUBLIC_REQUEST",
    body: { customer, address, project, industryFields },
    files: [],
    workspaceSlug,
    requestMeta: input.requestMeta,
    voiceIntakeMetadata: input.payload.voiceIntake,
  });

  return {
    id: result.requestId,
    requestNumber: result.requestNumber,
    estimateId: result.estimateId,
    queued: result.queued ?? false,
  };
}

