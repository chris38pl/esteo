import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { EstimateRequestPageBackground } from "@/features/estimate-requests/components/estimate-request-page-background";
import { PublicEstimateRequestClient } from "@/features/estimate-requests/components/public-estimate-request-client";
import { PublicEstimateHeader } from "@/features/estimate-requests/components/public-estimate-header";
import { incrementPublicFormVisit } from "@/features/customer-acquisition/server/increment-public-form-visit";
import { getPublicEstimateRequestPath } from "@/features/estimate-requests/routes";
import { getPublicEstimateRequestPageData } from "@/features/estimate-requests/server/public-service";
import { viewerHasWorkspaceAccess } from "@/features/workspaces/server/workspace-access";
import { toCurrentUserProfile } from "@/lib/avatars/user-avatar-presets";
import { DatabaseUnavailableError } from "@/lib/database/database-unavailable-error";
import type { Locale } from "@/lib/locale";
import { isLocale } from "@/lib/locale";
import { getCurrentUser } from "@/server/auth/get-current-user";

type PageParams = Promise<{ locale: string; workspaceSlug: string }>;

function resolveLocale(localeParam: string): Locale {
  return isLocale(localeParam) ? localeParam : "pl";
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale = resolveLocale(locale);

  const canonical = getPublicEstimateRequestPath(resolvedLocale, workspaceSlug);
  const languages: Record<string, string> = {
    pl: getPublicEstimateRequestPath("pl", workspaceSlug),
    en: getPublicEstimateRequestPath("en", workspaceSlug),
  };

  return {
    alternates: {
      canonical,
      languages,
    },
  };
}

export default async function PublicEstimateRequestPage({ params }: { params: PageParams }) {
  const { locale, workspaceSlug } = await params;
  const resolvedLocale = resolveLocale(locale);
  setRequestLocale(resolvedLocale);

  const pageData = await getPublicEstimateRequestPageData({
    workspaceSlug,
    locale: resolvedLocale,
  });

  if (!pageData) {
    notFound();
  }

  if (pageData.matchedViaAlias) {
    redirect(getPublicEstimateRequestPath(resolvedLocale, pageData.canonicalSlug));
  }

  let memberHeader: { backHref: string; currentUser: ReturnType<typeof toCurrentUserProfile> } | null =
    null;

  try {
    const user = await getCurrentUser();
    if (user && (await viewerHasWorkspaceAccess(user.id, pageData.workspace.id))) {
      memberHeader = {
        backHref: `/${resolvedLocale}/dashboard/${pageData.workspace.slug}/estimates`,
        currentUser: toCurrentUserProfile(user),
      };
    }
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) {
      throw error;
    }
  }

  if (!memberHeader) {
    try {
      await incrementPublicFormVisit(pageData.workspace.id);
    } catch (error) {
      if (!(error instanceof DatabaseUnavailableError)) {
        throw error;
      }
    }
  }

  return (
    <main className="min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      {memberHeader ? (
        <PublicEstimateHeader
          backHref={memberHeader.backHref}
          currentUser={memberHeader.currentUser}
        />
      ) : null}
      <div className="relative isolate overflow-x-hidden">
        <EstimateRequestPageBackground industry={pageData.workspace.industry} />

        <PublicEstimateRequestClient
          locale={resolvedLocale}
          pageData={pageData}
          canAccessWorkspace={memberHeader !== null}
        />
      </div>
    </main>
  );
}
