import type { ComponentStatus } from "@/features/marketing/content/status.config";
import { statusPageConfig } from "@/features/marketing/content/status.config";
import type { Locale } from "@/lib/locale";

const componentLabels: Record<string, Record<Locale, string>> = {
  app: { pl: "Aplikacja", en: "Application" },
  ai: { pl: "Generowanie AI", en: "AI" },
  auth: { pl: "Uwierzytelnianie", en: "Authentication" },
  payments: { pl: "Płatności", en: "Payments" },
  files: { pl: "Przesyłanie plików", en: "File uploads" },
  api: { pl: "API", en: "API" },
};

const statusLabels: Record<Locale, Record<ComponentStatus, string>> = {
  pl: {
    operational: "Działa prawidłowo",
    degraded: "Utrudnienia",
    outage: "Awaria",
    maintenance: "Prace serwisowe",
  },
  en: {
    operational: "Operational",
    degraded: "Degraded",
    outage: "Outage",
    maintenance: "Maintenance",
  },
};

const pageCopy: Record<
  Locale,
  {
    pageTitle: string;
    pageDescription: string;
    overallHeading: string;
    lastUpdatedPrefix: string;
    componentColumn: string;
    statusColumn: string;
    maintenanceHeading: string;
    maintenanceEmpty: string;
    incidentsHeading: string;
    incidentsEmpty: string;
    bannerTitle: string;
    bannerCta: string;
    bannerAvailabilityLabel: string;
    bannerLastIncidentLabel: string;
    bannerMonitoringLabel: string;
    bannerAllSystemsOperational: string;
    bannerNoIncidentsValue: string;
    bannerNoIncidentsSub: string;
    bannerDaysAgo: string;
    componentsHeading: string;
    legendOperational: string;
    legendDegraded: string;
    legendOutage: string;
    availabilityLabelWithPeriod: string;
    contactFooterText: string;
    contactFooterCta: string;
    resolvedLabel: string;
  }
> = {
  pl: {
    pageTitle: "Status systemu",
    pageDescription: "Aktualny stan wszystkich kluczowych usług Esteo.",
    overallHeading: "Ogólny status",
    lastUpdatedPrefix: "Ostatnia aktualizacja:",
    componentColumn: "Komponent",
    statusColumn: "Status",
    maintenanceHeading: "Planowane prace",
    maintenanceEmpty: "Brak zaplanowanych prac serwisowych.",
    incidentsHeading: "Ostatnie incydenty",
    incidentsEmpty: "Brak zgłoszonych incydentów.",
    bannerTitle: "Status systemu",
    bannerCta: "Zobacz szczegóły",
    bannerAvailabilityLabel: "Dostępność",
    bannerLastIncidentLabel: "Ostatni incydent",
    bannerMonitoringLabel: "Monitorowanie",
    bannerAllSystemsOperational: "Wszystkie systemy działają",
    bannerNoIncidentsValue: "Brak",
    bannerNoIncidentsSub: "Brak zgłoszonych incydentów",
    bannerDaysAgo: "{count} dni temu",
    componentsHeading: "Komponenty systemu",
    legendOperational: "Działa prawidłowo",
    legendDegraded: "Utrudnienia",
    legendOutage: "Awaria",
    availabilityLabelWithPeriod: "Dostępność ({period})",
    contactFooterText: "Masz problem? Skontaktuj się z naszym zespołem.",
    contactFooterCta: "Kontakt",
    resolvedLabel: "Rozwiązano",
  },
  en: {
    pageTitle: "System status",
    pageDescription: "Current status of all key Esteo services.",
    overallHeading: "Overall status",
    lastUpdatedPrefix: "Last updated:",
    componentColumn: "Component",
    statusColumn: "Status",
    maintenanceHeading: "Scheduled maintenance",
    maintenanceEmpty: "No scheduled maintenance.",
    incidentsHeading: "Recent incidents",
    incidentsEmpty: "No reported incidents.",
    bannerTitle: "System status",
    bannerCta: "See details",
    bannerAvailabilityLabel: "Availability",
    bannerLastIncidentLabel: "Last incident",
    bannerMonitoringLabel: "Monitoring",
    bannerAllSystemsOperational: "All systems operational",
    bannerNoIncidentsValue: "None",
    bannerNoIncidentsSub: "No reported incidents",
    bannerDaysAgo: "{count} days ago",
    componentsHeading: "System components",
    legendOperational: "Operational",
    legendDegraded: "Degraded",
    legendOutage: "Outage",
    availabilityLabelWithPeriod: "Availability ({period})",
    contactFooterText: "Having an issue? Contact our team.",
    contactFooterCta: "Contact",
    resolvedLabel: "Resolved",
  },
};

function formatLastUpdated(locale: Locale, isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatDateOnly(locale: Locale, isoDate: string): string {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
    dateStyle: "long",
  }).format(date);
}

function getBannerShortStatusMessage(locale: Locale, status: ComponentStatus): string {
  const copy = pageCopy[locale];

  if (status === "operational") {
    return copy.bannerAllSystemsOperational;
  }

  return getOverallStatusMessage(locale).message;
}

function getLastIncidentBannerStat(locale: Locale): {
  value: string;
  sub: string;
  highlight: boolean;
} {
  const copy = pageCopy[locale];
  const incidents = statusPageConfig.incidents;

  if (incidents.length === 0) {
    return {
      value: copy.bannerNoIncidentsValue,
      sub: copy.bannerNoIncidentsSub,
      highlight: false,
    };
  }

  const latest = [...incidents].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )[0];
  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(latest.occurredAt).getTime()) / (1000 * 60 * 60 * 24)),
  );

  return {
    value: copy.bannerDaysAgo.replace("{count}", String(daysAgo)),
    sub: formatDateOnly(locale, latest.occurredAt),
    highlight: false,
  };
}

function getWorstStatus(statuses: ComponentStatus[]): ComponentStatus {
  const priority: ComponentStatus[] = ["outage", "degraded", "maintenance", "operational"];
  for (const status of priority) {
    if (statuses.includes(status)) {
      return status;
    }
  }
  return "operational";
}

export function getOverallStatusMessage(locale: Locale): {
  status: ComponentStatus;
  label: string;
  message: string;
} {
  const componentStatuses = statusPageConfig.components.map((component) => component.status);
  const worst = getWorstStatus(componentStatuses);
  const effectiveStatus =
    statusPageConfig.overallStatus === "operational" ? worst : statusPageConfig.overallStatus;

  if (effectiveStatus === "operational" && componentStatuses.every((s) => s === "operational")) {
    return locale === "pl"
      ? {
          status: "operational",
          label: statusLabels.pl.operational,
          message: "Wszystkie systemy działają prawidłowo.",
        }
      : {
          status: "operational",
          label: statusLabels.en.operational,
          message: "All services are operating normally.",
        };
  }

  if (effectiveStatus === "degraded") {
    return locale === "pl"
      ? {
          status: "degraded",
          label: statusLabels.pl.degraded,
          message: "Niektóre usługi działają z ograniczeniami.",
        }
      : {
          status: "degraded",
          label: statusLabels.en.degraded,
          message: "Some services are experiencing degraded performance.",
        };
  }

  if (effectiveStatus === "outage") {
    return locale === "pl"
      ? {
          status: "outage",
          label: statusLabels.pl.outage,
          message: "Występują problemy z dostępnością usług.",
        }
      : {
          status: "outage",
          label: statusLabels.en.outage,
          message: "Some services are unavailable.",
        };
  }

  return locale === "pl"
    ? {
        status: "maintenance",
        label: statusLabels.pl.maintenance,
        message: "Trwają planowane prace serwisowe.",
      }
    : {
        status: "maintenance",
        label: statusLabels.en.maintenance,
        message: "Scheduled maintenance is in progress.",
      };
}

export function getStatusBannerContent(locale: Locale) {
  const copy = pageCopy[locale];
  const overall = getOverallStatusMessage(locale);
  const lastIncident = getLastIncidentBannerStat(locale);
  const banner = statusPageConfig.banner;

  return {
    title: copy.bannerTitle,
    overallStatus: overall.status,
    overallLabel: overall.label,
    shortStatusMessage: getBannerShortStatusMessage(locale, overall.status),
    message: overall.message,
    lastUpdatedShort: `${copy.lastUpdatedPrefix} ${formatLastUpdated(locale, statusPageConfig.lastUpdatedAt)}`,
    ctaLabel: copy.bannerCta,
    availability: {
      label: copy.bannerAvailabilityLabel,
      value: banner.availability.value[locale],
      sub: banner.availability.period[locale],
    },
    lastIncident: {
      label: copy.bannerLastIncidentLabel,
      value: lastIncident.value,
      sub: lastIncident.sub,
      highlight: lastIncident.highlight,
    },
    monitoring: {
      label: copy.bannerMonitoringLabel,
      value: banner.monitoring.value,
      sub: banner.monitoring.mode[locale],
    },
  };
}

export type StatusPageContent = {
  pageTitle: string;
  pageDescription: string;
  overallStatus: ComponentStatus;
  overallLabel: string;
  overallMessage: string;
  lastUpdated: string;
  availabilityValue: string;
  availabilityLabel: string;
  componentsHeading: string;
  legend: { operational: string; degraded: string; outage: string };
  components: { id: string; name: string; status: ComponentStatus; statusLabel: string }[];
  maintenanceHeading: string;
  maintenanceEmpty: string;
  maintenanceItems: {
    id: string;
    title: string;
    description?: string;
    schedule: string;
  }[];
  incidentsHeading: string;
  incidentsEmpty: string;
  incidents: {
    id: string;
    title: string;
    description: string;
    occurredAt: string;
    resolvedAt?: string;
  }[];
  contactFooterText: string;
  contactFooterCta: string;
  resolvedLabel: string;
};

export function getStatusPageContent(locale: Locale): StatusPageContent {
  const copy = pageCopy[locale];
  const overall = getOverallStatusMessage(locale);
  const banner = statusPageConfig.banner;

  return {
    pageTitle: copy.pageTitle,
    pageDescription: copy.pageDescription,
    overallStatus: overall.status,
    overallLabel: overall.label,
    overallMessage: overall.message,
    lastUpdated: `${copy.lastUpdatedPrefix} ${formatLastUpdated(locale, statusPageConfig.lastUpdatedAt)}`,
    availabilityValue: banner.availability.value[locale],
    availabilityLabel: copy.availabilityLabelWithPeriod.replace(
      "{period}",
      banner.availability.period[locale],
    ),
    componentsHeading: copy.componentsHeading,
    legend: {
      operational: copy.legendOperational,
      degraded: copy.legendDegraded,
      outage: copy.legendOutage,
    },
    components: statusPageConfig.components.map((component) => ({
      id: component.id,
      name: componentLabels[component.id]?.[locale] ?? component.id,
      status: component.status,
      statusLabel: statusLabels[locale][component.status],
    })),
    maintenanceHeading: copy.maintenanceHeading,
    maintenanceEmpty: copy.maintenanceEmpty,
    maintenanceItems: statusPageConfig.plannedMaintenance.map((item) => {
      const start = new Date(item.startsAt);
      const end = new Date(item.endsAt);
      const dateFormatter = new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
        dateStyle: "long",
      });
      const timeFormatter = new Intl.DateTimeFormat(locale === "pl" ? "pl-PL" : "en-GB", {
        timeStyle: "short",
      });

      return {
        id: item.id,
        title: item.title[locale],
        description: item.description?.[locale],
        schedule: `${dateFormatter.format(start)}\n${timeFormatter.format(start)}–${timeFormatter.format(end)} ${item.timezoneLabel}`,
      };
    }),
    incidentsHeading: copy.incidentsHeading,
    incidentsEmpty: copy.incidentsEmpty,
    incidents: statusPageConfig.incidents.map((incident) => ({
      id: incident.id,
      title: incident.title[locale],
      description: incident.description[locale],
      occurredAt: formatLastUpdated(locale, incident.occurredAt),
      resolvedAt: incident.resolvedAt
        ? formatLastUpdated(locale, incident.resolvedAt)
        : undefined,
    })),
    contactFooterText: copy.contactFooterText,
    contactFooterCta: copy.contactFooterCta,
    resolvedLabel: copy.resolvedLabel,
  };
}
