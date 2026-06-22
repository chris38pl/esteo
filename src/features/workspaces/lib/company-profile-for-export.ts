import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";

export type WorkspaceCompanyProfileField =
  | "logo"
  | "address"
  | "taxId"
  | "email"
  | "phone";

export type WorkspaceCompanyProfileClient = {
  address: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  logoStorageKey: string | null;
  logoUrl?: string | null;
};

export type WorkspaceCompanyProfileExport = WorkspaceCompanyProfileClient & {
  name: string;
  logoUrl: string | null;
};

type WorkspaceWithSettings = {
  name: string;
  settings: {
    companyAddress: string | null;
    companyTaxId: string | null;
    companyEmail: string | null;
    companyPhone: string | null;
    branding: unknown;
  } | null;
};

export function buildWorkspaceCompanyProfileExport(
  workspace: WorkspaceWithSettings,
): WorkspaceCompanyProfileExport {
  const brandingResult = workspaceBrandingSchema.safeParse(
    workspace.settings?.branding ?? {},
  );
  const branding = brandingResult.success ? brandingResult.data : null;

  return {
    name: workspace.name,
    address: workspace.settings?.companyAddress ?? null,
    taxId: workspace.settings?.companyTaxId ?? null,
    email: workspace.settings?.companyEmail ?? null,
    phone: workspace.settings?.companyPhone ?? null,
    logoUrl: branding?.logoUrl ?? null,
    logoStorageKey: branding?.logoStorageKey ?? null,
  };
}

export function serializeWorkspaceCompanyProfileClient(
  workspace: WorkspaceWithSettings,
): WorkspaceCompanyProfileClient {
  const profile = buildWorkspaceCompanyProfileExport(workspace);

  return {
    address: profile.address,
    taxId: profile.taxId,
    email: profile.email,
    phone: profile.phone,
    logoStorageKey: profile.logoStorageKey,
    logoUrl: profile.logoUrl,
  };
}

function hasValue(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

export function getMissingWorkspaceCompanyProfileFields(
  profile: WorkspaceCompanyProfileClient,
): WorkspaceCompanyProfileField[] {
  const missing: WorkspaceCompanyProfileField[] = [];

  if (!hasValue(profile.logoStorageKey) && !hasValue(profile.logoUrl)) {
    missing.push("logo");
  }
  if (!hasValue(profile.address)) {
    missing.push("address");
  }
  if (!hasValue(profile.taxId)) {
    missing.push("taxId");
  }
  if (!hasValue(profile.email)) {
    missing.push("email");
  }
  if (!hasValue(profile.phone)) {
    missing.push("phone");
  }

  return missing;
}

export function isWorkspaceCompanyProfileComplete(
  profile: WorkspaceCompanyProfileClient,
): boolean {
  return getMissingWorkspaceCompanyProfileFields(profile).length === 0;
}
