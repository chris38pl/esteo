import type { Prisma, User, WorkspaceIndustry, WorkspaceRule } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { prisma } from "@/db/client";
import { getSystemEstimateTemplateForIndustry } from "@/features/estimate-templates/config/system-templates";
import type { EstimateTemplateInput } from "@/features/estimate-templates/schemas/estimate-template";
import type { PriceListInput } from "@/features/price-lists/schemas/price-list";
import { logAuditEvent } from "@/features/workspaces/server/repository";
import { getWorkspaceEntitlements } from "@/server/billing/entitlement-service";
import { EntitlementError, WorkspaceError } from "@/server/permissions/errors";
import { requireRole } from "@/server/permissions/require-workspace";

export type ConfigurationAccess = {
  canUsePremiumConfiguration: boolean;
  canEditPremiumConfiguration: boolean;
  plan: "FREE" | "PRO" | "BUSINESS";
  reason: "FREE_PLAN" | "READ_ONLY" | null;
};

const templateInclude = {
  sections: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      items: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  },
} satisfies Prisma.EstimateTemplateInclude;

const priceListInclude = {
  items: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.PriceListInclude;

const configurationWorkspaceInclude = {
  settings: true,
  estimateTemplates: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: templateInclude,
  },
  priceLists: {
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: priceListInclude,
  },
} satisfies Prisma.WorkspaceInclude;

export type WorkspaceConfigurationPageData = {
  workspace: {
    id: string;
    slug: string;
    industry: WorkspaceIndustry;
    industryOtherText: string | null;
  };
  companyDescription: string;
  aiInstructions: string;
  branding: Prisma.JsonValue | null;
  access: ConfigurationAccess;
  rules: WorkspaceRule[];
  defaultEstimateTemplateId: string | null;
  defaultPriceListId: string | null;
  templates: SerializedTemplate[];
  priceLists: SerializedPriceList[];
  systemTemplate: ReturnType<typeof getSystemEstimateTemplateForIndustry>;
};

export type EstimateTemplateWithItems = Prisma.EstimateTemplateGetPayload<{
  include: typeof templateInclude;
}>;

export type PriceListWithItems = Prisma.PriceListGetPayload<{
  include: typeof priceListInclude;
}>;

export function serializePriceListItemDecimal(value: PrismaNamespace.Decimal): string {
  return value.toFixed(2);
}

function serializeNullableDecimal(value: PrismaNamespace.Decimal | null): string | null {
  return value ? value.toString() : null;
}

export function serializeTemplate(template: EstimateTemplateWithItems) {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    sortOrder: template.sortOrder,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    sections: template.sections.map((section) => ({
      id: section.id,
      title: section.title,
      guidance: section.guidance,
      sortOrder: section.sortOrder,
      items: section.items.map((item) => ({
        id: item.id,
        name: item.name,
        unit: item.unit,
        guidance: item.guidance,
        sortOrder: item.sortOrder,
      })),
    })),
  };
}

export function serializePriceList(priceList: PriceListWithItems) {
  return {
    id: priceList.id,
    name: priceList.name,
    currency: priceList.currency,
    sortOrder: priceList.sortOrder,
    createdAt: priceList.createdAt.toISOString(),
    updatedAt: priceList.updatedAt.toISOString(),
    items: priceList.items.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      unitPrice: serializePriceListItemDecimal(item.unitPrice),
      vatRate: serializeNullableDecimal(item.vatRate),
      note: item.note,
      sortOrder: item.sortOrder,
    })),
  };
}

export type SerializedTemplate = ReturnType<typeof serializeTemplate>;
export type SerializedTemplateSection = SerializedTemplate["sections"][number];
export type SerializedTemplateItem = SerializedTemplateSection["items"][number];
export type SerializedPriceList = ReturnType<typeof serializePriceList>;

export type SerializedTemplateListItem = {
  id: string;
  name: string;
  description: string | null;
  sectionCount: number;
  itemCount: number;
  updatedAt: string;
};

export function serializeTemplateListItem(template: EstimateTemplateWithItems): SerializedTemplateListItem {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    sectionCount: template.sections.length,
    itemCount: template.sections.reduce((sum, section) => sum + section.items.length, 0),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export type SerializedPriceListListItem = {
  id: string;
  name: string;
  currency: string;
  itemCount: number;
  updatedAt: string;
};

export function serializePriceListListItem(priceList: PriceListWithItems): SerializedPriceListListItem {
  return {
    id: priceList.id,
    name: priceList.name,
    currency: priceList.currency,
    itemCount: priceList.items.length,
    updatedAt: priceList.updatedAt.toISOString(),
  };
}

export type GenerationConfigurationOption = {
  id: string;
  name: string;
};

export type GenerationConfigurationOptions = {
  canUsePremiumConfiguration: boolean;
  defaultTemplateId: string | null;
  defaultPriceListId: string | null;
  templates: GenerationConfigurationOption[];
  priceLists: GenerationConfigurationOption[];
};

export async function getConfigurationAccess(
  workspaceId: string,
): Promise<ConfigurationAccess> {
  const entitlements = await getWorkspaceEntitlements(workspaceId);
  const paid = entitlements.plan === "PRO" || entitlements.plan === "BUSINESS";
  const activeForMutation =
    entitlements.effectiveStatus === "ACTIVE" || entitlements.effectiveStatus === "PAST_DUE";

  return {
    canUsePremiumConfiguration: paid && activeForMutation,
    canEditPremiumConfiguration: paid && activeForMutation,
    plan: entitlements.plan,
    reason: !paid ? "FREE_PLAN" : activeForMutation ? null : "READ_ONLY",
  };
}

async function assertCanEditPremiumConfiguration(workspaceId: string): Promise<void> {
  const access = await getConfigurationAccess(workspaceId);
  if (!access.canEditPremiumConfiguration) {
    throw new EntitlementError(
      "Szablony i cenniki są dostępne w planach Pro i Business.",
      access.reason ?? "FEATURE_DISABLED",
    );
  }
}

export async function getEstimateTemplateWorkspaceData(
  user: User,
  workspaceId: string,
  templateId?: string,
) {
  await requireRole(user, workspaceId, "OWNER");

  const [workspace, access] = await Promise.all([
    prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      include: {
        settings: true,
        estimateTemplates: {
          where: { deletedAt: null },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          include: templateInclude,
        },
      },
    }),
    getConfigurationAccess(workspaceId),
  ]);

  if (!workspace) {
    throw new WorkspaceError("Workspace nie został znaleziony.");
  }

  const currentRecord = templateId
    ? workspace.estimateTemplates.find((template) => template.id === templateId)
    : null;

  if (templateId && !currentRecord) {
    throw new WorkspaceError("Szablon nie został znaleziony.");
  }

  return {
    templates: workspace.estimateTemplates.map(serializeTemplateListItem),
    defaultTemplateId: workspace.settings?.defaultEstimateTemplateId ?? null,
    access,
    template: currentRecord ? serializeTemplate(currentRecord) : null,
  };
}

export async function getPriceListWorkspaceData(
  user: User,
  workspaceId: string,
  priceListId?: string,
) {
  await requireRole(user, workspaceId, "OWNER");

  const [workspace, access] = await Promise.all([
    prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      include: {
        settings: true,
        priceLists: {
          where: { deletedAt: null },
          orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
          include: priceListInclude,
        },
      },
    }),
    getConfigurationAccess(workspaceId),
  ]);

  if (!workspace) {
    throw new WorkspaceError("Workspace nie został znaleziony.");
  }

  const currentRecord = priceListId
    ? workspace.priceLists.find((priceList) => priceList.id === priceListId)
    : null;

  if (priceListId && !currentRecord) {
    throw new WorkspaceError("Cennik nie został znaleziony.");
  }

  return {
    priceLists: workspace.priceLists.map(serializePriceListListItem),
    defaultPriceListId: workspace.settings?.defaultPriceListId ?? null,
    access,
    priceList: currentRecord ? serializePriceList(currentRecord) : null,
  };
}

export async function getEstimateTemplateForEditor(
  user: User,
  workspaceId: string,
  templateId: string,
) {
  await requireRole(user, workspaceId, "OWNER");

  const [template, access] = await Promise.all([
    prisma.estimateTemplate.findFirst({
      where: { id: templateId, workspaceId, deletedAt: null },
      include: templateInclude,
    }),
    getConfigurationAccess(workspaceId),
  ]);

  if (!template) {
    throw new WorkspaceError("Szablon nie został znaleziony.");
  }

  return {
    template: serializeTemplate(template),
    access,
  };
}

export async function getWorkspaceConfigurationPageData(
  user: User,
  workspaceId: string,
): Promise<WorkspaceConfigurationPageData | null> {
  await requireRole(user, workspaceId, "OWNER");

  const [workspace, access, rules] = await Promise.all([
    prisma.workspace.findFirst({
      where: { id: workspaceId, deletedAt: null },
      include: configurationWorkspaceInclude,
    }),
    getConfigurationAccess(workspaceId),
    prisma.workspaceRule.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  if (!workspace) {
    return null;
  }

  const settings = workspace.settings;

  return {
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      industry: workspace.industry,
      industryOtherText: workspace.industryOtherText,
    },
    companyDescription: settings?.companyDescription ?? "",
    aiInstructions: settings?.aiInstructions ?? "",
    branding: settings?.branding ?? null,
    access,
    rules,
    defaultEstimateTemplateId: settings?.defaultEstimateTemplateId ?? null,
    defaultPriceListId: settings?.defaultPriceListId ?? null,
    templates: workspace.estimateTemplates.map(serializeTemplate),
    priceLists: workspace.priceLists.map(serializePriceList),
    systemTemplate: getSystemEstimateTemplateForIndustry(workspace.industry),
  };
}

export async function getGenerationConfigurationOptions(
  workspaceId: string,
): Promise<GenerationConfigurationOptions> {
  const access = await getConfigurationAccess(workspaceId);

  if (!access.canUsePremiumConfiguration) {
    return {
      canUsePremiumConfiguration: false,
      defaultTemplateId: null,
      defaultPriceListId: null,
      templates: [],
      priceLists: [],
    };
  }

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, deletedAt: null },
    include: {
      settings: true,
      estimateTemplates: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true },
      },
      priceLists: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true },
      },
    },
  });

  return {
    canUsePremiumConfiguration: true,
    defaultTemplateId: workspace?.settings?.defaultEstimateTemplateId ?? null,
    defaultPriceListId: workspace?.settings?.defaultPriceListId ?? null,
    templates: workspace?.estimateTemplates ?? [],
    priceLists: workspace?.priceLists ?? [],
  };
}

async function ensureWorkspaceSettings(workspaceId: string, tx: Prisma.TransactionClient = prisma) {
  return tx.workspaceSettings.upsert({
    where: { workspaceId },
    create: { workspaceId },
    update: {},
  });
}

export async function createEstimateTemplate(
  user: User,
  workspaceId: string,
  input: EstimateTemplateInput,
) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  const template = await prisma.$transaction(async (tx) => {
    await ensureWorkspaceSettings(workspaceId, tx);
    const count = await tx.estimateTemplate.count({ where: { workspaceId, deletedAt: null } });
    return tx.estimateTemplate.create({
      data: {
        workspaceId,
        name: input.name,
        description: input.description || null,
        sortOrder: count,
        sections: {
          create: input.sections.map((section, sectionIndex) => ({
            title: section.title,
            guidance: section.guidance || null,
            sortOrder: section.sortOrder ?? sectionIndex,
            items: {
              create: section.items.map((item, itemIndex) => ({
                name: item.name,
                unit: item.unit || null,
                guidance: item.guidance || null,
                sortOrder: item.sortOrder ?? itemIndex,
              })),
            },
          })),
        },
      },
      include: templateInclude,
    });
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "EstimateTemplate",
    entityId: template.id,
    action: "created",
  });

  return template;
}

export async function updateEstimateTemplate(
  user: User,
  workspaceId: string,
  templateId: string,
  input: EstimateTemplateInput,
) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  const existing = await prisma.estimateTemplate.findFirst({
    where: { id: templateId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    throw new WorkspaceError("Template not found.");
  }

  const template = await prisma.$transaction(async (tx) => {
    await tx.estimateTemplateItem.deleteMany({
      where: { section: { templateId } },
    });
    await tx.estimateTemplateSection.deleteMany({ where: { templateId } });
    return tx.estimateTemplate.update({
      where: { id: templateId },
      data: {
        name: input.name,
        description: input.description || null,
        sections: {
          create: input.sections.map((section, sectionIndex) => ({
            title: section.title,
            guidance: section.guidance || null,
            sortOrder: section.sortOrder ?? sectionIndex,
            items: {
              create: section.items.map((item, itemIndex) => ({
                name: item.name,
                unit: item.unit || null,
                guidance: item.guidance || null,
                sortOrder: item.sortOrder ?? itemIndex,
              })),
            },
          })),
        },
      },
      include: templateInclude,
    });
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "EstimateTemplate",
    entityId: templateId,
    action: "updated",
  });

  return template;
}

export async function deleteEstimateTemplate(user: User, workspaceId: string, templateId: string) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  const existing = await prisma.estimateTemplate.findFirst({
    where: { id: templateId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    throw new WorkspaceError("Template not found.");
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.workspaceSettings.updateMany({
      where: { workspaceId, defaultEstimateTemplateId: templateId },
      data: { defaultEstimateTemplateId: null },
    });
    return tx.estimateTemplate.update({
      where: { id: templateId },
      data: { deletedAt: new Date() },
    });
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "EstimateTemplate",
    entityId: templateId,
    action: "deleted",
  });

  return deleted;
}

export async function setDefaultEstimateTemplate(
  user: User,
  workspaceId: string,
  templateId: string | null,
) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  if (templateId) {
    const existing = await prisma.estimateTemplate.findFirst({
      where: { id: templateId, workspaceId, deletedAt: null },
    });
    if (!existing) {
      throw new WorkspaceError("Template not found.");
    }
  }

  const settings = await prisma.workspaceSettings.upsert({
    where: { workspaceId },
    create: { workspaceId, defaultEstimateTemplateId: templateId },
    update: { defaultEstimateTemplateId: templateId },
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceSettings",
    entityId: settings.id,
    action: "default_estimate_template_updated",
    diff: { defaultEstimateTemplateId: templateId },
  });

  return settings;
}

export async function createPriceList(user: User, workspaceId: string, input: PriceListInput) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  const priceList = await prisma.$transaction(async (tx) => {
    await ensureWorkspaceSettings(workspaceId, tx);
    const count = await tx.priceList.count({ where: { workspaceId, deletedAt: null } });
    return tx.priceList.create({
      data: {
        workspaceId,
        name: input.name,
        currency: input.currency,
        sortOrder: count,
        items: {
          create: input.items.map((item, index) => ({
            name: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate || null,
            note: item.note || null,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: priceListInclude,
    });
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "PriceList",
    entityId: priceList.id,
    action: "created",
  });

  return priceList;
}

export async function updatePriceList(
  user: User,
  workspaceId: string,
  priceListId: string,
  input: PriceListInput,
) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  const existing = await prisma.priceList.findFirst({
    where: { id: priceListId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    throw new WorkspaceError("Price list not found.");
  }

  const priceList = await prisma.$transaction(async (tx) => {
    await tx.priceListItem.deleteMany({ where: { priceListId } });
    return tx.priceList.update({
      where: { id: priceListId },
      data: {
        name: input.name,
        currency: input.currency,
        items: {
          create: input.items.map((item, index) => ({
            name: item.name,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate || null,
            note: item.note || null,
            sortOrder: item.sortOrder ?? index,
          })),
        },
      },
      include: priceListInclude,
    });
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "PriceList",
    entityId: priceListId,
    action: "updated",
  });

  return priceList;
}

export async function deletePriceList(user: User, workspaceId: string, priceListId: string) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  const existing = await prisma.priceList.findFirst({
    where: { id: priceListId, workspaceId, deletedAt: null },
  });
  if (!existing) {
    throw new WorkspaceError("Price list not found.");
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.workspaceSettings.updateMany({
      where: { workspaceId, defaultPriceListId: priceListId },
      data: { defaultPriceListId: null },
    });
    return tx.priceList.update({
      where: { id: priceListId },
      data: { deletedAt: new Date() },
    });
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "PriceList",
    entityId: priceListId,
    action: "deleted",
  });

  return deleted;
}

export async function setDefaultPriceList(
  user: User,
  workspaceId: string,
  priceListId: string | null,
) {
  await requireRole(user, workspaceId, "OWNER");
  await assertCanEditPremiumConfiguration(workspaceId);

  if (priceListId) {
    const existing = await prisma.priceList.findFirst({
      where: { id: priceListId, workspaceId, deletedAt: null },
    });
    if (!existing) {
      throw new WorkspaceError("Price list not found.");
    }
  }

  const settings = await prisma.workspaceSettings.upsert({
    where: { workspaceId },
    create: { workspaceId, defaultPriceListId: priceListId },
    update: { defaultPriceListId: priceListId },
  });

  await logAuditEvent({
    actorUserId: user.id,
    workspaceId,
    entityType: "WorkspaceSettings",
    entityId: settings.id,
    action: "default_price_list_updated",
    diff: { defaultPriceListId: priceListId },
  });

  return settings;
}
