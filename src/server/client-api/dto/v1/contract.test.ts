import assert from "node:assert/strict";

import { accountProfileSchema } from "@/server/client-api/dto/v1/account/dto";
import { toAccountProfile, type AccountProfileInput } from "@/server/client-api/dto/v1/account/mapper";
import {
  workspaceOverviewSchema,
  workspaceRefSchema,
} from "@/server/client-api/dto/v1/workspace/dto";
import {
  toWorkspaceOverview,
  toWorkspaceRef,
  type WorkspaceOverviewInput,
} from "@/server/client-api/dto/v1/workspace/mapper";
import {
  estimateCardSchema,
  estimateDetailSchema,
} from "@/server/client-api/dto/v1/estimate/dto";
import {
  toEstimateCard,
  toEstimateDetail,
  type EstimateCardInput,
  type EstimateDetailInput,
} from "@/server/client-api/dto/v1/estimate/mapper";
import {
  requestCardSchema,
  requestDetailSchema,
} from "@/server/client-api/dto/v1/request/dto";
import {
  toRequestCard,
  toRequestDetail,
  type RequestCardInput,
  type RequestDetailInput,
} from "@/server/client-api/dto/v1/request/mapper";
import { inboxCountsSchema, inboxItemSchema } from "@/server/client-api/dto/v1/inbox/dto";
import {
  toInboxCounts,
  toInboxItem,
  type InboxItemInput,
} from "@/server/client-api/dto/v1/inbox/mapper";
import { dashboardSummarySchema } from "@/server/client-api/dto/v1/dashboard/dto";
import {
  toDashboardSummary,
  type DashboardSummaryInput,
} from "@/server/client-api/dto/v1/dashboard/mapper";
import { bootstrapSchema } from "@/server/client-api/dto/v1/bootstrap/dto";
import { toBootstrap, type BootstrapInput } from "@/server/client-api/dto/v1/bootstrap/mapper";

/**
 * DTO contract tests. These assert the PUBLIC CONTRACT only: every mapper
 * output must satisfy its Zod schema. They deliberately do NOT assert business
 * logic (no `expect(dto.sections.length).toBe(5)` style checks).
 */

function check(name: string, schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } }, value: unknown) {
  const result = schema.safeParse(value);
  assert.equal(result.success, true, `${name} must satisfy its DTO schema: ${JSON.stringify(result.error)}`);
}

// account
const accountInput: AccountProfileInput = {
  id: "u1",
  email: "user@example.com",
  name: "Jan Kowalski",
  avatarPreset: "architect",
  avatarSource: "PRESET",
  avatarUrl: null,
};
check("AccountProfile", accountProfileSchema, toAccountProfile(accountInput));

// workspace
check("WorkspaceRef", workspaceRefSchema, toWorkspaceRef({ id: "w1", slug: "acme", name: "Acme" }));

const overviewInput: WorkspaceOverviewInput = {
  workspace: { id: "w1", slug: "acme", name: "Acme", attachmentStorageUsedBytes: 2048 },
  role: "OWNER",
  entitlements: {
    plan: "PRO",
    effectiveStatus: "ACTIVE",
    limits: { maxStorageBytes: 1_000_000 },
    usage: { estimatesThisMonth: 3, aiCallsThisMonth: 7 },
    seats: { used: 1, limit: 3 },
  },
};
check("WorkspaceOverview", workspaceOverviewSchema, toWorkspaceOverview(overviewInput));

// estimate
const estimateCardInput: EstimateCardInput = {
  id: "e1",
  title: "Wykończenie mieszkania",
  currency: "PLN",
  attachmentCount: 1,
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  latestVersion: { status: "DRAFT", totalNet: 100, totalGross: 123 },
  estimateRequest: { requestNumber: "R-1" },
  _count: { versions: 2 },
  listContext: { customerName: "Anna", investmentCity: "Kraków" },
};
check("EstimateCard", estimateCardSchema, toEstimateCard(estimateCardInput));

const estimateDetailInput: EstimateDetailInput = {
  estimate: {
    id: "e1",
    title: "Wykończenie mieszkania",
    currency: "PLN",
    latestVersion: { status: "SENT", totalNet: 100, totalGross: 123 },
    versions: [{}, {}],
  },
  versionTree: {
    id: "v1",
    versionNumber: 1,
    status: "SENT",
    marginPercent: 10,
    sections: [
      {
        id: "s1",
        title: "Sekcja",
        sortOrder: 0,
        lineItems: [
          {
            id: "li1",
            sectionId: "s1",
            name: "Pozycja",
            unit: "szt",
            quantity: 1,
            unitPrice: 10,
            vatRate: 23,
            sortOrder: 0,
          },
        ],
      },
    ],
  },
  attachmentCount: 1,
};
check("EstimateDetail", estimateDetailSchema, toEstimateDetail(estimateDetailInput));

// request
const requestCardInput: RequestCardInput = {
  id: "r1",
  requestNumber: "R-1",
  status: "PENDING",
  customerFullName: "Anna Nowak",
  customerEmail: "anna@example.com",
  city: "Kraków",
  propertyType: "flat",
  attachmentCount: 0,
  estimateId: null,
  estimateTitle: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};
check("RequestCard", requestCardSchema, toRequestCard(requestCardInput));

const requestDetailInput: RequestDetailInput = {
  id: "r1",
  requestNumber: "R-1",
  status: "COMPLETED",
  projectDescription: "Opis projektu",
  attachmentCount: 0,
  customerData: { fullName: "Anna Nowak", email: "anna@example.com", phone: "123" },
  address: { streetAddress: "ul. Testowa 1", city: "Kraków", postalCode: "30-001", voivodeship: "małopolskie" },
  estimate: { id: "e1", title: "Wycena" },
  industryFields: [{ key: "area", label: "Powierzchnia", value: "50" }],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};
check("RequestDetail", requestDetailSchema, toRequestDetail(requestDetailInput));

// inbox
const inboxItemInput: InboxItemInput = {
  id: "n1",
  type: "ESTIMATE_SENT",
  state: "UNREAD",
  priority: "NORMAL",
  href: "/inbox/n1",
  primaryActionLabelKey: null,
  primaryActionHref: null,
  secondaryActionLabelKey: null,
  secondaryActionHref: null,
  payload: { foo: "bar" },
  readAt: null,
  resolvedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  workspaceId: "w1",
  workspaceName: "Acme",
};
check("InboxItem", inboxItemSchema, toInboxItem(inboxItemInput));
check("InboxCounts", inboxCountsSchema, toInboxCounts({ total: 3, unread: 2, actionRequired: 1 }));

// dashboard
const dashboardInput: DashboardSummaryInput = {
  greetingName: "Jan",
  workspace: { id: "w1", slug: "acme", name: "Acme" },
  stats: {
    byHorizon: {
      all: {
        estimates: { value: 5 },
        sent: { value: 2 },
        income: { value: 1000, currency: "PLN" },
      },
    },
    overdue: { amount: 0, count: 0, currency: "PLN" },
  },
};
check("DashboardSummary", dashboardSummarySchema, toDashboardSummary(dashboardInput));

// bootstrap
const bootstrapInput: BootstrapInput = {
  meta: { apiVersion: "v1", dtoVersion: "v1", serverVersion: "0.1.0" },
  user: accountInput,
  locale: "pl",
  workspaces: [{ id: "w1", slug: "acme", name: "Acme" }],
  activeWorkspace: overviewInput,
  permissions: { role: "OWNER", canCreateEstimate: true, canInviteMembers: true },
  subscription: { plan: "PRO", status: "ACTIVE" },
  entitlements: {
    plan: "PRO",
    usage: { estimatesThisMonth: 3, aiCallsThisMonth: 7 },
    seats: { used: 1, limit: 3 },
    limits: { maxEstimatesPerMonth: 100, maxStorageBytes: 1_000_000 },
  },
  featureFlags: {},
};
const bootstrap = toBootstrap(bootstrapInput);
check("Bootstrap", bootstrapSchema, bootstrap);
assert.ok(bootstrap.meta.apiVersion, "bootstrap.meta.apiVersion must be present");

// bootstrap without an active workspace (session context is still valid)
check(
  "Bootstrap (no workspace)",
  bootstrapSchema,
  toBootstrap({
    ...bootstrapInput,
    workspaces: [],
    activeWorkspace: null,
    permissions: { role: null, canCreateEstimate: false, canInviteMembers: false },
    subscription: null,
    entitlements: null,
  }),
);

console.log("client-api DTO contract tests: ok");
