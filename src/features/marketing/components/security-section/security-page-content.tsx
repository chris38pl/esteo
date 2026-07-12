import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import {
  TrustCenterContainer,
  TrustDetailSidebar,
  TrustDocLinkList,
  TrustPointGrid,
  TrustPromisesSection,
  TrustProviderGrid,
  TrustStatusBanner,
} from "@/features/marketing/components/trust-center";
import { getSecurityPageContent } from "@/features/marketing/content/security-content";
import { getTrustSharedContent } from "@/features/marketing/content/trust-shared-content";
import type { Locale } from "@/lib/locale";

function DetailPanelHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      {intro ? (
        <p className="text-sm leading-6 text-muted-foreground sm:text-[0.9375rem] sm:leading-7">
          {intro}
        </p>
      ) : null}
    </div>
  );
}

export function SecurityPageContent({ locale }: { locale: Locale }) {
  const content = getSecurityPageContent(locale);
  const shared = getTrustSharedContent(locale);
  const { providersPanel } = content;

  const detailTabs = [
    {
      id: "providers",
      label: providersPanel.tabLabel,
      panel: (
        <div className="space-y-6">
          <DetailPanelHeading title={providersPanel.title} intro={providersPanel.intro} />
          <TrustProviderGrid
            providers={providersPanel.providers}
            disclaimer={providersPanel.disclaimer}
          />
        </div>
      ),
    },
    ...content.detailSections.map((section) => ({
      id: section.id,
      label: section.label,
      panel: (
        <div className="space-y-4">
          <DetailPanelHeading title={section.title} />
          <p className="text-sm leading-7 text-muted-foreground sm:text-[0.9375rem]">{section.body}</p>
        </div>
      ),
    })),
  ];

  return (
    <TrustCenterContainer className="space-y-12 sm:space-y-16">
      <MarketingPageHeader
        title={content.pageTitle}
        description={content.pageDescription}
        subtitle={content.pageSubtitle}
        centered
      />

      <TrustPointGrid points={content.points} />

      <TrustPromisesSection
        titleBefore={shared.promisesSectionTitleBefore}
        titleHighlight={shared.promisesSectionTitleHighlight}
        subtitle={shared.promisesSectionSubtitle}
        promises={content.promises}
      />

      <TrustStatusBanner locale={locale} />

      <TrustDetailSidebar
        title={shared.technicalDetailsTitle}
        tabs={detailTabs}
        defaultTabId="providers"
      />

      <TrustDocLinkList heading={shared.learnMoreHeading} links={content.docLinks} />

      <p className="text-center text-xs leading-5 text-muted-foreground">{content.footerNote}</p>
    </TrustCenterContainer>
  );
}
