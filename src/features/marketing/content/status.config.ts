export type ComponentStatus = "operational" | "degraded" | "outage" | "maintenance";

export type StatusComponent = {
  id: string;
  status: ComponentStatus;
};

export type PlannedMaintenanceItem = {
  id: string;
  startsAt: string;
  endsAt: string;
  timezoneLabel: string;
  title: Record<"pl" | "en", string>;
  description?: Record<"pl" | "en", string>;
};

export type StatusIncident = {
  id: string;
  occurredAt: string;
  title: Record<"pl" | "en", string>;
  description: Record<"pl" | "en", string>;
  resolvedAt?: string;
  affectedComponentIds: string[];
};

/** Manually update when service status changes. */
export const statusPageConfig = {
  lastUpdatedAt: "2026-07-12T10:34:00.000Z",
  overallStatus: "operational" as ComponentStatus,
  components: [
    { id: "app", status: "operational" },
    { id: "ai", status: "operational" },
    { id: "auth", status: "operational" },
    { id: "payments", status: "operational" },
    { id: "files", status: "operational" },
    { id: "api", status: "operational" },
  ] satisfies StatusComponent[],
  plannedMaintenance: [] as PlannedMaintenanceItem[],
  incidents: [] as StatusIncident[],
  /** Banner teaser stats — edit manually (no automated uptime feed on MVP). */
  banner: {
    availability: {
      value: { pl: "99,99%", en: "99.99%" },
      period: { pl: "30 dni", en: "30 days" },
    },
    monitoring: {
      value: "24/7",
      mode: { pl: "Automatyczne", en: "Automatic" },
    },
  },
};
