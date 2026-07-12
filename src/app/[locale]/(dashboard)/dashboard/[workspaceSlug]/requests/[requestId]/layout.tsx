import type { Metadata } from "next";
import type { ReactNode } from "react";

import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import { getRequestDocumentTitle } from "@/features/app/metadata/get-entity-document-title";
import { resolveRequestLocale } from "@/i18n/request-locale";
import { prisma } from "@/db/client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; workspaceSlug: string; requestId: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, workspaceSlug, requestId } = await params;
  const locale = await resolveRequestLocale(localeParam);

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });

  const title = workspace
    ? await getRequestDocumentTitle({
        requestId,
        workspaceId: workspace.id,
        locale,
      })
    : "Esteo";

  return createAppMetadata({ title });
}

export default function WorkspaceRequestDetailLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-w-0 w-full max-w-full">{children}</div>;
}
