import type { LegalPageContent } from "@/features/marketing/content/legal-content";
import { getTrustSharedContent } from "@/features/marketing/content/trust-shared-content";
import {
  LegalDocumentAccordion,
  LegalDocumentMeta,
  TrustDocumentDivider,
  TrustHighlightCardStrip,
  TrustLegalBreadcrumb,
  TrustPrincipleRows,
  TrustRulesChecklist,
  TrustSupportFooter,
} from "@/features/marketing/components/trust-center";
import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import type { Locale } from "@/lib/locale";

type LegalDocumentProps = {
  content: LegalPageContent;
  locale: Locale;
};

function LegalSummary({ content }: { content: LegalPageContent }) {
  switch (content.summary.type) {
    case "cards":
      return <TrustHighlightCardStrip items={content.summary.items} />;
    case "checklist":
      return <TrustRulesChecklist items={content.summary.items} />;
    case "principles":
      return <TrustPrincipleRows items={content.summary.items} />;
    default:
      return null;
  }
}

export function LegalDocument({ content, locale }: LegalDocumentProps) {
  const shared = getTrustSharedContent(locale);
  const displayTitle = content.pageTitleUI ?? content.pageTitle;

  return (
    <article className="space-y-8">
      <TrustLegalBreadcrumb
        locale={locale}
        hubLabel={shared.securityCenterLabel}
        currentLabel={content.breadcrumbLabel}
      />

      <MarketingPageHeader
        title={displayTitle}
        description={content.pageDescription}
        subtitle={content.pageSubtitle}
      />

      <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-900 dark:text-amber-100">
        {content.draftNotice}
      </p>

      <LegalSummary content={content} />

      <TrustDocumentDivider label={content.fullDocumentLabel} />

      <LegalDocumentMeta
        lastUpdatedLabel={shared.lastUpdatedLabel}
        lastUpdated={content.lastUpdated}
        versionLabel={shared.versionLabel}
        documentVersion={content.documentVersion}
      />

      <LegalDocumentAccordion sections={content.sections} />

      <TrustSupportFooter
        heading={shared.supportHeading}
        email={shared.supportEmail}
        linkLabel={shared.supportLink}
      />
    </article>
  );
}
