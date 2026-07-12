import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import {
  LegalDocumentMeta,
  TrustCenterContainer,
  TrustLegalBreadcrumb,
  TrustLegalTable,
  TrustSupportFooter,
} from "@/features/marketing/components/trust-center";
import { getSubprocessorsPageContent } from "@/features/marketing/content/subprocessors-content";
import { getTrustSharedContent } from "@/features/marketing/content/trust-shared-content";
import type { Locale } from "@/lib/locale";

export function SubprocessorsPageContent({ locale }: { locale: Locale }) {
  const content = getSubprocessorsPageContent(locale);
  const shared = getTrustSharedContent(locale);

  return (
    <TrustCenterContainer>
      <article className="space-y-8">
        <TrustLegalBreadcrumb
          locale={locale}
          hubLabel={shared.securityCenterLabel}
          currentLabel={content.breadcrumbLabel}
        />

        <MarketingPageHeader title={content.pageTitle} description={content.pageDescription} />

        <p className="text-sm leading-7 text-muted-foreground">{content.introParagraph}</p>

        <LegalDocumentMeta
          lastUpdatedLabel={shared.lastUpdatedLabel}
          lastUpdated={content.lastUpdated}
        />

        <TrustLegalTable
          table={{
            headers: [...content.tableHeaders],
            rows: content.tableRows,
          }}
        />

        <div className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>{content.footnoteScope}</p>
          <p>{content.footnoteUpdates}</p>
        </div>

        <TrustSupportFooter
          heading={shared.supportHeading}
          subtext={shared.supportSubtext}
          ctaLabel={shared.supportCtaLabel}
          email={shared.supportEmail}
        />
      </article>
    </TrustCenterContainer>
  );
}
