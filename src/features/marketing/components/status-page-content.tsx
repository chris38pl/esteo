import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import {
  StatusBottomSections,
  StatusComponentsGrid,
  StatusContactFooter,
  StatusPageHero,
  TrustCenterContainer,
} from "@/features/marketing/components/trust-center";
import { getStatusPageContent } from "@/features/marketing/content/status-content";
import type { Locale } from "@/lib/locale";

export function StatusPageContent({ locale }: { locale: Locale }) {
  const content = getStatusPageContent(locale);

  return (
    <TrustCenterContainer className="space-y-10 sm:space-y-12">
      <MarketingPageHeader title={content.pageTitle} description={content.pageDescription} />

      <StatusPageHero
        overallStatus={content.overallStatus}
        overallLabel={content.overallLabel}
        overallMessage={content.overallMessage}
        lastUpdated={content.lastUpdated}
        availabilityValue={content.availabilityValue}
        availabilityLabel={content.availabilityLabel}
      />

      <StatusComponentsGrid
        heading={content.componentsHeading}
        legend={content.legend}
        components={content.components}
      />

      <StatusBottomSections
        maintenanceHeading={content.maintenanceHeading}
        maintenanceEmpty={content.maintenanceEmpty}
        maintenanceItems={content.maintenanceItems}
        incidentsHeading={content.incidentsHeading}
        incidentsEmpty={content.incidentsEmpty}
        incidents={content.incidents}
        resolvedLabel={content.resolvedLabel}
      />

      <StatusContactFooter
        locale={locale}
        text={content.contactFooterText}
        ctaLabel={content.contactFooterCta}
      />
    </TrustCenterContainer>
  );
}
