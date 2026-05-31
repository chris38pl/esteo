# ADR 001: Workspace deletion and slug policy (MVP)

**Status:** Accepted  
**Date:** 2026-05-30  
**Scope:** MVP workspace lifecycle

## Context

Workspaces accumulate large amounts of related data (estimates, field values, audit logs, members, invitations). Hard-deleting a workspace would require careful cascade ordering, risk data loss, and complicate compliance and support.

At the same time, each workspace has a globally unique `slug` (intended for future URL paths). When an owner deletes a workspace and later creates a new one with the same display name, we must decide whether the original slug can be reused.

Three common approaches were considered:

| Option | Slug on archive | Recreate same slug? |
| --- | --- | --- |
| A — Partial unique index | Unchanged on row | Yes (unique among active only) |
| B — Tombstone rename | Rewritten (e.g. `acme__archived__id`) | Yes (canonical slug freed) |
| C — Never reuse | Unchanged on row | No (`acme-2`, `acme-3`, …) |

## Decision

For MVP we adopt:

1. **Soft delete (archive) only** — set `Workspace.deletedAt`; do not hard-delete workspace rows or related documents.
2. **Option C — slugs are never reused** — global `@unique` on `slug` includes archived workspaces. New workspaces get automatic suffixes via `resolveAvailableSlug()` (`acme`, `acme-2`, …).
3. **Owner delete via settings** — General tab danger zone; confirmation dialog; `archiveWorkspace` server action.
4. **Archive side effects:**
   - Revoke all `PENDING` invitations (`REVOKED`).
   - Reconcile owner active workspace cookie / `lastActiveWorkspaceId`.
   - Members lose access immediately (queries filter `deletedAt IS NULL`).
5. **Display name is not globally unique** — only the slug is; owners may reuse the same workspace name after delete.

## Rationale

- **Soft delete** matches the product reality: hundreds of documents per workspace; audit and support need historical context.
- **Option C** is the smallest change (no migration, no slug mutation on archive) and avoids ambiguity in logs or future public URLs that might reference a slug.
- Suffix allocation (`acme-2`) is already implemented and tested in creation flow.
- Acceptable MVP trade-off: users rarely need the exact same URL slug back; they care more about display name and a clean re-onboarding path.

## Consequences

### Positive

- Simple implementation and mental model.
- No partial unique index or raw SQL migration required.
- Archived data remains queryable for admin/debug and future export.
- Billing entitlements (`countOwnedWorkspaces`) correctly exclude archived workspaces.

### Negative

- Slug `acme` remains reserved forever after first use, even after delete.
- Recreating “the same” workspace shows a suffixed URL (`acme-2`) — must be communicated in delete UI copy.
- Database grows with archived rows (acceptable for MVP scale).

### Neutral

- Members’ stale active-workspace cookies are ignored on render until reconciled (existing resolution chain).
- Hard purge and GDPR “right to erasure” are explicitly deferred.

## Out of scope (MVP)

- Restore archived workspace within a retention window.
- Scheduled purge / anonymization job after N days.
- Partial unique index (Option A) or tombstone slug rename (Option B).
- Owner notification when a member leaves.

## References

- Implementation: `archiveWorkspace` in `src/features/workspaces/server/service.ts`
- Slug allocation: `resolveAvailableSlug()` in same file
- UI: `WorkspaceSettingsDeleteSection`, `DeleteWorkspaceDialog`
- Docs: `docs/architecture/database.md` (slug rules, archive), `docs/features/workspace-onboarding.md`
