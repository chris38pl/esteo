import { MarketingPageHeader } from "@/features/marketing/components/marketing-page-header";
import {
  StatusIndicator,
  TrustCenterContainer,
} from "@/features/marketing/components/trust-center";
import { getStatusPageContent } from "@/features/marketing/content/status-content";
import type { Locale } from "@/lib/locale";

export function StatusPageContent({ locale }: { locale: Locale }) {
  const content = getStatusPageContent(locale);

  return (
    <TrustCenterContainer className="space-y-10 sm:space-y-12">
      <div className="mx-auto max-w-3xl space-y-4">
        <MarketingPageHeader title={content.pageTitle} description={content.pageDescription} />

        <div className="rounded-xl border border-border/45 bg-card/35 p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {content.overallHeading}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusIndicator
              status={content.overallStatus}
              label={content.overallLabel}
              className="text-base font-medium"
            />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{content.overallMessage}</p>
          <p className="mt-3 text-xs text-muted-foreground">{content.lastUpdated}</p>
        </div>
      </div>

      <section className="mx-auto max-w-3xl space-y-4">
        <div className="overflow-x-auto rounded-xl border border-border/45">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/35 bg-muted/20">
                <th className="px-5 py-3 font-medium text-foreground">{content.componentColumn}</th>
                <th className="px-5 py-3 text-right font-medium text-foreground">
                  {content.statusColumn}
                </th>
              </tr>
            </thead>
            <tbody>
              {content.components.map((component, index) => (
                <tr
                  key={component.id}
                  className={index % 2 === 1 ? "border-b border-border/25 bg-muted/10" : "border-b border-border/25"}
                >
                  <td className="px-5 py-3 font-medium text-foreground">{component.name}</td>
                  <td className="px-5 py-3">
                    <StatusIndicator
                      status={component.status}
                      label={component.statusLabel}
                      align="end"
                      className="w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-3">
        <h2 className="text-base font-semibold text-foreground">{content.maintenanceHeading}</h2>
        {content.maintenanceItems.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">{content.maintenanceEmpty}</p>
        ) : (
          <ul className="space-y-4">
            {content.maintenanceItems.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border/45 bg-card/35 p-4 text-sm leading-6"
              >
                <p className="font-medium text-foreground">{item.title}</p>
                <p className="mt-1 whitespace-pre-line text-muted-foreground">{item.schedule}</p>
                {item.description ? (
                  <p className="mt-2 text-muted-foreground">{item.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto max-w-3xl space-y-3 pb-4">
        <h2 className="text-base font-semibold text-foreground">{content.incidentsHeading}</h2>
        {content.incidents.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">{content.incidentsEmpty}</p>
        ) : (
          <ul className="space-y-4">
            {content.incidents.map((incident) => (
              <li
                key={incident.id}
                className="rounded-xl border border-border/45 bg-card/35 p-4 text-sm leading-6"
              >
                <p className="font-medium text-foreground">{incident.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{incident.occurredAt}</p>
                <p className="mt-2 text-muted-foreground">{incident.description}</p>
                {incident.resolvedAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {locale === "pl" ? "Rozwiązano:" : "Resolved:"} {incident.resolvedAt}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </TrustCenterContainer>
  );
}
