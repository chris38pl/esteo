import { parseRouteContext } from "@/features/app/navigation/parse-route-context";
import {
  matchAppRoute,
  resolveTitleKeyForRoute,
  type AppRouteEntry,
} from "@/features/app/navigation/route-registry";
import {
  formatWorkspaceTitle,
  translateTitleKey,
} from "@/features/app/metadata/translate-title-key";
import { prisma } from "@/db/client";
import type { Locale } from "@/lib/locale";

export type ResolvePageTitleInput = {
  locale: Locale;
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
  workspaceName?: string | null;
  entityTitle?: string | null;
};

async function resolveWorkspaceNameFromSlug(slug: string): Promise<string | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { name: true },
  });
  return workspace?.name?.trim() || null;
}

function applyTitleFormat(
  label: string,
  entry: AppRouteEntry,
  workspaceName: string | null,
  entityTitle: string | null,
): string {
  const titleFormat = entry.titleFormat ?? "plain";

  if (titleFormat === "entity") {
    return entityTitle?.trim() || label;
  }

  if (titleFormat === "workspace") {
    return formatWorkspaceTitle(workspaceName ?? "", label);
  }

  return label;
}

export async function resolvePageTitle(input: ResolvePageTitleInput): Promise<string> {
  const ctx = parseRouteContext(input.pathname, input.searchParams);
  if (!ctx) {
    return "Esteo";
  }

  const route = matchAppRoute(ctx);
  if (!route) {
    return "Esteo";
  }

  const titleKey = resolveTitleKeyForRoute(route, ctx.searchTab);
  const label = await translateTitleKey(input.locale, titleKey);

  let workspaceName = input.workspaceName?.trim() || null;
  if (!workspaceName && route.titleFormat === "workspace" && ctx.workspaceSlug) {
    workspaceName = await resolveWorkspaceNameFromSlug(ctx.workspaceSlug);
  }

  return applyTitleFormat(label, route, workspaceName, input.entityTitle ?? null);
}

export function resolveMatchedRoute(pathname: string, searchParams?: Record<string, string | string[] | undefined>) {
  const ctx = parseRouteContext(pathname, searchParams);
  if (!ctx) {
    return null;
  }
  return matchAppRoute(ctx);
}
