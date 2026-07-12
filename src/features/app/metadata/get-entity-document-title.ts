import "server-only";

import { prisma } from "@/db/client";
import {
  extractClientNameFromCustomerData,
  resolveEstimateEntityTitle,
} from "@/features/app/metadata/resolve-estimate-entity-title";
import { translateTitleKey } from "@/features/app/metadata/translate-title-key";
import { parseRequestCustomerData } from "@/features/estimate-requests/lib/parse-request-json";
import { getIssueByNumber } from "@/features/issues/server/repository";
import { getOpsCaseByNumber } from "@/features/ops-cases/server/repository";
import { getServerTranslations } from "@/i18n/request-locale";
import type { Locale } from "@/lib/locale";

export async function getEstimateDocumentTitle(input: {
  estimateId: string;
  workspaceId: string;
  locale: Locale;
}): Promise<string> {
  const [estimate, t] = await Promise.all([
    prisma.estimate.findFirst({
      where: {
        id: input.estimateId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
      select: {
        title: true,
        estimateRequest: {
          select: {
            requestNumber: true,
            customerData: true,
          },
        },
      },
    }),
    getServerTranslations(input.locale, "estimates"),
  ]);

  const fallback = t("editor.untitled");

  if (!estimate) {
    return fallback;
  }

  return resolveEstimateEntityTitle(
    {
      title: estimate.title,
      clientName: extractClientNameFromCustomerData(estimate.estimateRequest?.customerData),
      reference: estimate.estimateRequest?.requestNumber,
    },
    fallback,
  );
}

export async function getRequestDocumentTitle(input: {
  requestId: string;
  workspaceId: string;
  locale: Locale;
}): Promise<string> {
  const [request, t] = await Promise.all([
    prisma.estimateRequest.findFirst({
      where: {
        id: input.requestId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
      select: {
        requestNumber: true,
        customerData: true,
        projectDescription: true,
      },
    }),
    getServerTranslations(input.locale, "requests"),
  ]);

  const fallback = t("list.noRequestNumber");
  if (!request) {
    return fallback;
  }

  const customer = parseRequestCustomerData(request.customerData);
  return (
    customer?.fullName?.trim() ||
    request.requestNumber?.trim() ||
    request.projectDescription?.trim() ||
    fallback
  );
}

export async function getIssueDocumentTitle(input: {
  number: number;
  locale: Locale;
  fallbackTitleKey?: string;
}): Promise<string> {
  const issue = await getIssueByNumber(input.number);
  const fallbackKey = input.fallbackTitleKey ?? "issues.admin.title";
  const fallback = await translateTitleKey(input.locale, fallbackKey);

  return issue?.title?.trim() || fallback;
}

export async function getOpsCaseDocumentTitle(input: {
  number: number;
  locale: Locale;
}): Promise<string> {
  const [opsCase, fallback] = await Promise.all([
    getOpsCaseByNumber(input.number),
    translateTitleKey(input.locale, "ops-cases.admin.title"),
  ]);

  return opsCase?.title?.trim() || fallback;
}

export async function getTemplateDocumentTitle(input: {
  templateId: string;
  workspaceId: string;
  locale: Locale;
}): Promise<string> {
  const [template, t] = await Promise.all([
    prisma.estimateTemplate.findFirst({
      where: {
        id: input.templateId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
      select: { name: true },
    }),
    getServerTranslations(input.locale, "workspaces"),
  ]);

  const fallback = t("configuration.templates.editor.pageTitle");
  return template?.name?.trim() || fallback;
}

export async function getAdminEstimateRequestDocumentTitle(input: {
  requestId: string;
  locale: Locale;
}): Promise<string> {
  const [request, t] = await Promise.all([
    prisma.estimateRequest.findFirst({
      where: { id: input.requestId, deletedAt: null },
      select: {
        requestNumber: true,
        customerData: true,
        projectDescription: true,
      },
    }),
    getServerTranslations(input.locale, "admin.estimateRequests"),
  ]);

  const fallback = t("title");
  if (!request) {
    return fallback;
  }

  const customer = parseRequestCustomerData(request.customerData);
  return (
    customer?.fullName?.trim() ||
    request.requestNumber?.trim() ||
    request.projectDescription?.trim() ||
    fallback
  );
}
