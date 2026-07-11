# Workspace branding and company profile

Workspace owners can configure a **company logo** and **company contact details** used in the app UI today and on **client-facing PDFs** (PDF generation not implemented yet).

Settings route: `/[locale]/dashboard/[workspaceSlug]/settings` - OWNER only (`settings/layout.tsx`).

## Settings tabs

| Tab | Query param | Content |
| --- | --- | --- |
| Ogólne / General | (default) | Name, theme, company description (AI), logo upload, delete workspace |
| Dane / Company | `?tab=company` | Read-only company name + editable address, NIP, email, phone |
| Użytkownicy / Users | `?tab=users` | Members and invites |
| Reguły / Rules | `?tab=rules` | AI rules and estimate sections |

UI shell: `src/features/workspaces/components/workspace-settings-panel.tsx`

---

## Company logo

### Data model

Logo metadata lives in `WorkspaceSettings.branding` JSON (no dedicated columns):

| Field | Purpose |
| --- | --- |
| `logoStorageKey` | UploadThing file key - **source of truth for PDF/backend** (`storage.download`) |
| `logoUrl` | Public CDN URL from UploadThing - **UI only** (sidebar, settings preview) |

Zod: `src/features/workspaces/schemas/branding.ts`

### Upload pipeline

```txt
Client FormData → POST /api/workspaces/logo/upload
→ Sharp (logo limits) → UploadThing (UTApi)
→ merge branding (logoStorageKey + logoUrl)
→ delete previous logoStorageKey (best-effort)
```

- **Not** counted against `Workspace.attachmentStorageUsedBytes` (estimate attachment quota).
- **Immediate upload** - independent of the General tab “Save changes” button.
- Replace/delete/remove logo: `removeWorkspaceLogoAction` with confirmation dialog.

### Logo limits

Constants: `src/features/workspaces/lib/logo-constants.ts`

| Limit | Value |
| --- | --- |
| Raw upload max | 2 MB |
| Allowed MIME | JPEG, PNG, WebP |
| Max dimension after processing | 512 px (longest side, `fit: inside`) |
| Target stored size | ≤ ~300 KB (quality reduction for JPEG/WebP if needed) |

Storage key (logical path, logging only):

```txt
{workspaceId}/branding/logo/{fileId}/original-{sanitizedName}
```

UploadThing `customId` = short UUID (36 chars), **not** the full path - see [incident: customId batch failure](../incidents/2026-06-07-uploadthing-customid-batch-upload-partial-failure.md).

### Display

- Settings preview: `WorkspaceLogoField` - `<Image src={logoUrl} />`
- Sidebar / workspace switcher: `WorkspaceSummary.logoUrl` from dashboard layout batch load
- `next.config.ts` `images.remotePatterns`: `utfs.io`, `*.ufs.sh`

### Cleanup

- **Replace logo:** old `logoStorageKey` deleted from UploadThing after successful new upload.
- **Remove logo:** `removeWorkspaceLogo` clears branding fields + deletes UT file.
- **Archive workspace:** `archiveWorkspace` calls `cleanupWorkspaceLogoStorage` before soft delete.

Implementation: `src/features/workspaces/server/logo-service.ts`

---

## Company profile (Dane tab)

### Data model

Dedicated columns on `WorkspaceSettings` (migration `20260610120000_workspace_company_profile_fields`):

| Column | UI label (PL) | Notes |
| --- | --- | --- |
| - | Nazwa firmy | **`Workspace.name`** - read-only in Dane tab; edit in Ogólne |
| `companyAddress` | Adres | Optional, max 300 chars |
| `companyTaxId` | NIP | Optional; if set, 10 digits (spaces/dashes stripped on save) |
| `companyEmail` | E-mail | Optional, valid email |
| `companyPhone` | Telefon | Optional, 6–40 chars |

All fields optional - empty strings persist as `null`.

Zod: `src/features/workspaces/schemas/company-profile.ts`  
Save: `updateWorkspaceCompanyProfileAction` → `updateWorkspaceCompanyProfile` (OWNER, audit `company_profile_updated`).

UI: `src/features/workspaces/components/workspace-settings-company-tab.tsx`

### Distinction from `companyDescription`

| Field | Location | Used for |
| --- | --- | --- |
| `companyDescription` | `WorkspaceSettings.companyDescription` | AI prompt context (`## Company context`) - edited in **Ogólne** |
| `companyAddress`, `companyTaxId`, … | `WorkspaceSettings` columns | Client documents / PDF company block - edited in **Dane** |

Do not merge these concerns in the UI or schema.

---

## PDF export (future)

PDF is **not implemented**. When added, use:

```ts
import { buildWorkspaceCompanyProfileExport } from "@/features/workspaces/lib/company-profile-for-export";
```

Returns:

```ts
{
  name,           // Workspace.name
  address,        // companyAddress
  taxId,          // companyTaxId (NIP)
  email,          // companyEmail
  phone,          // companyPhone
  logoUrl,        // branding - optional for preview/mockups
  logoStorageKey, // branding - use storage.download() for PDF bytes
}
```

**Rule:** render logo in PDF via `logoStorageKey` → `getStorageProvider().download()`, not via `logoUrl`.

See also: [`estimate-pdf-export.md`](estimate-pdf-export.md).

---

## Code map

| Concern | Path |
| --- | --- |
| Logo upload API | `src/app/api/workspaces/logo/upload/route.ts` |
| Logo service | `src/features/workspaces/server/logo-service.ts` |
| Logo UI | `src/features/workspaces/components/workspace-logo-field.tsx` |
| Remove logo dialog | `src/features/workspaces/components/remove-workspace-logo-dialog.tsx` |
| Company tab UI | `src/features/workspaces/components/workspace-settings-company-tab.tsx` |
| Company profile action | `updateWorkspaceCompanyProfileAction` in `actions.ts` |
| PDF helper | `src/features/workspaces/lib/company-profile-for-export.ts` |
| UploadThing provider (public URL) | `src/features/attachments/server/storage/uploadthing-provider.ts` |
| i18n | `workspaces.settings.logo.*`, `workspaces.settings.company.*` in `src/messages/{pl,en}/workspaces.json` |

---

## Related

- [Estimate attachments](estimate-attachments.md) - shared UploadThing / `StorageProvider` pattern
- [Estimate PDF export](estimate-pdf-export.md)
- [Database - WorkspaceSettings](../architecture/database.md)
- [Workspace onboarding](workspace-onboarding.md) - settings access (OWNER)
