import { workspaceBrandingSchema } from "@/features/workspaces/schemas/branding";

export type WorkspaceCompanyProfileExport = {
  name: string;
  address: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  logoUrl: string | null;
  logoStorageKey: string | null;
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
