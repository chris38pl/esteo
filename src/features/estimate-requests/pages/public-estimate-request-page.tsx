import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { PublicEstimateRequestClient } from "@/features/estimate-requests/components/public-estimate-request-client";
import { PublicEstimateHeader } from "@/features/estimate-requests/components/public-estimate-header";
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

  return (
    <main className="min-h-dvh w-full min-w-0 overflow-x-hidden bg-background text-foreground">
      {memberHeader ? (
        <PublicEstimateHeader
          backHref={memberHeader.backHref}
          currentUser={memberHeader.currentUser}
        />
      ) : null}
      <div className="relative isolate overflow-x-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/estimate-request/estimate-request-light.webp"
            alt=""
            fill
            priority
            className="object-cover object-left-top dark:hidden"
          />
          <Image
            src="/images/estimate-request/estimate-request-dark.webp"
            alt=""
            fill
            priority
            className="hidden object-cover object-left-top dark:block"
          />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_40%),radial-gradient(circle_at_80%_15%,rgba(99,102,241,0.14),transparent_45%)] dark:bg-[radial-gradient(circle_at_18%_12%,rgba(59,130,246,0.18),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.16),transparent_45%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/55 to-background/95" />
        </div>

        <PublicEstimateRequestClient locale={resolvedLocale} pageData={pageData} />
      </div>
    </main>
  );
}
