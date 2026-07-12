import assert from "node:assert/strict";

import plAdmin from "@/messages/pl/admin.json";
import plAuth from "@/messages/pl/auth.json";
import plBilling from "@/messages/pl/billing.json";
import plDashboard from "@/messages/pl/dashboard.json";
import plEstimates from "@/messages/pl/estimates.json";
import plIssues from "@/messages/pl/issues.json";
import plNavbar from "@/messages/pl/navbar.json";
import plRequests from "@/messages/pl/requests.json";
import plWorkspaces from "@/messages/pl/workspaces.json";

import { parseRouteContext } from "@/features/app/navigation/parse-route-context";
import {
  matchAppRoute,
  resolveTitleKeyForRoute,
} from "@/features/app/navigation/route-registry";
import { createAppMetadata } from "@/features/app/metadata/create-app-metadata";
import {
  extractClientNameFromCustomerData,
  resolveEstimateEntityTitle,
} from "@/features/app/metadata/resolve-estimate-entity-title";
import { formatWorkspaceTitle, splitTitleKey } from "@/features/app/metadata/translate-title-key";
import { shouldNoIndexPath } from "@/features/app/metadata/should-no-index-path";

const PL_MESSAGES: Record<string, unknown> = {
  admin: plAdmin,
  auth: plAuth,
  billing: plBilling,
  dashboard: plDashboard,
  estimates: plEstimates,
  issues: plIssues,
  navbar: plNavbar,
  requests: plRequests,
  workspaces: plWorkspaces,
};

function getNestedValue(source: Record<string, unknown>, key: string): string {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, source as unknown);

  if (typeof value !== "string") {
    throw new Error(`Expected string at ${key}`);
  }
  return value;
}

function translatePl(titleKey: string): string {
  const { namespace, key } = splitTitleKey(titleKey);
  const root = PL_MESSAGES[namespace];
  assert.ok(root, `Missing namespace bundle: ${namespace}`);
  return getNestedValue(root as Record<string, unknown>, key);
}

function resolvePlPageTitle(input: {
  pathname: string;
  searchParams?: Record<string, string | string[] | undefined>;
  workspaceName?: string | null;
  entityTitle?: string | null;
}): string {
  const ctx = parseRouteContext(input.pathname, input.searchParams);
  assert.ok(ctx, `Could not parse route: ${input.pathname}`);
  const route = matchAppRoute(ctx);
  assert.ok(route, `No registry match for: ${input.pathname}`);

  const titleKey = resolveTitleKeyForRoute(route, ctx.searchTab);
  const label = translatePl(titleKey);
  const titleFormat = route.titleFormat ?? "plain";

  if (titleFormat === "entity") {
    return input.entityTitle?.trim() || label;
  }

  if (titleFormat === "workspace") {
    return formatWorkspaceTitle(input.workspaceName ?? "", label);
  }

  return label;
}

// Registry snapshot cases
assert.equal(
  resolvePlPageTitle({ pathname: "/pl/dashboard/ski-force/estimates" }),
  "Wyceny",
);
assert.equal(resolvePlPageTitle({ pathname: "/pl/dashboard/ski-force" }), "Panel");
assert.equal(resolvePlPageTitle({ pathname: "/pl/dashboard" }), "Panel");
assert.equal(resolvePlPageTitle({ pathname: "/pl/sign-in" }), "Logowanie");
assert.equal(
  resolvePlPageTitle({
    pathname: "/pl/dashboard/ski-force/settings",
    workspaceName: "SkiForce",
  }),
  "SkiForce – Ustawienia przestrzeni",
);
assert.equal(
  resolvePlPageTitle({
    pathname: "/pl/dashboard/ski-force/settings",
    searchParams: { tab: "users" },
    workspaceName: "SkiForce",
  }),
  "SkiForce – Użytkownicy",
);
assert.equal(
  resolvePlPageTitle({
    pathname: "/pl/dashboard/ski-force/settings",
    searchParams: { tab: "general" },
    workspaceName: "SkiForce",
  }),
  "SkiForce – Ogólne",
);
assert.equal(resolvePlPageTitle({ pathname: "/pl/dashboard/admin/users" }), "Użytkownicy");

// Entity fallback chain
assert.equal(
  resolveEstimateEntityTitle({ title: "Remont łazienki" }, "Wycena"),
  "Remont łazienki",
);
assert.equal(
  resolveEstimateEntityTitle(
    {
      clientName: "Jan Kowalski",
      reference: "EST-2026-0012",
    },
    "Wycena",
  ),
  "Jan Kowalski",
);
assert.equal(
  resolveEstimateEntityTitle({ reference: "EST-2026-0012" }, "Wycena"),
  "EST-2026-0012",
);
assert.equal(resolveEstimateEntityTitle({}, "Wycena"), "Wycena");

assert.equal(
  extractClientNameFromCustomerData({ fullName: " Jan Kowalski " }),
  "Jan Kowalski",
);

// Robots path guard
assert.equal(shouldNoIndexPath("/pl/dashboard/ski-force/estimates"), true);
assert.equal(shouldNoIndexPath("/pl/sign-in"), true);
assert.equal(shouldNoIndexPath("/pl/sign-in/forgot-password"), true);
assert.equal(shouldNoIndexPath("/pl/sign-up"), true);
assert.equal(shouldNoIndexPath("/pl/dashboard/onboarding"), true);
assert.equal(shouldNoIndexPath("/api/health"), false);

// Metadata helper
const metadata = createAppMetadata({ title: "Wyceny" });
assert.equal(metadata.title, "Wyceny");
assert.deepEqual(metadata.robots, { index: false, follow: false });

const brandMetadata = createAppMetadata({ title: "Esteo" });
assert.deepEqual(brandMetadata.title, { absolute: "Esteo" });

console.log("resolve-page-title.test.ts: all assertions passed");
