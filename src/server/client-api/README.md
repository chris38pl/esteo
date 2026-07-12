# Client API (v1)

Shared, versioned API platform for external clients (React Native first;
Desktop/Tauri, CLI, partner API, AI Agent, MCP later). This is **not** a BFF —
there are many clients, not one frontend. The web app keeps using Server
Actions unchanged.

## Architecture

Web and external clients are **peer layers** over the same service layer.

```
Web (RSC + Server Actions) ─┐
                            ├─▶ Service Layer (features/*/server) ─▶ Prisma / DB
Clients ─▶ clientRouter ─────┘        ▲
          (tRPC, /api/trpc)           │
              └─▶ DTO mappers ────────┘
```

Hard rules:

- `Server Action -> tRPC -> Service` — forbidden.
- `tRPC -> Server Action -> Service` — forbidden.
- `Router -> Prisma.findMany()` — forbidden (enforced by ESLint: no `@prisma/client`
  / `@/db/client` imports under `client-api/**`). Data flow is always
  `Prisma -> Service -> Mapper -> DTO`.
- `clientRouter.X -> clientRouter.Y` — forbidden. Endpoints never call each
  other; share logic via the service layer.
- tRPC is transport + DTO aggregation, **not** a second authorization layer.
  Permissions/workspace/entitlements stay in `src/server/permissions/*` and the
  service layer.

## Layout

```
dto/v1/<feature>/{dto.ts, mapper.ts}   # Zod DTO schemas + pure mappers
routers/<feature>.ts                   # use-case endpoints (call services)
root.ts                                # clientRouter + createClientCaller
version.ts                             # apiVersion / dtoVersion / serverVersion
```

- **DTOs** are flat, screen-oriented Zod schemas, independent of Prisma models.
- **Mappers** are pure functions (`input -> output`): no `await`, `fetch`,
  `prisma`, or service calls. They use structural input types so they never
  import `@prisma/client`.

## Versioning

- **v1 is never breaking.** Within a version we only *add* fields.
- **Per-endpoint.** `v2` need not reimplement every `v1` endpoint.

## Offline strategy (v1 — decision, not implementation)

- **Read-through cache only** (network-layer cache such as TanStack Query on the
  client). No local database / sync engine.
- **Writes are online-only.** Mutations require connectivity; no offline queue.
- **No optimistic updates.** After a mutation the client refetches / invalidates.
- **IDs are server-generated only.** No client-side UUID/cuid — simpler, no
  collisions, no reconciliation.
- Consequence for the API: mutations return a fresh DTO so the client can update
  its cache without a second round-trip.

Full offline (sync, mutation queue, conflict resolution) is a later, separate
effort.

## Auth & transport

- **Dual-source auth.** Clerk resolves the caller from the session cookie (web)
  or `Authorization: Bearer <token>` (external clients) transparently. The
  Client API enforces auth in the tRPC layer (`requireApiUser` / the
  `protectedProcedure` middleware), returning a clean `401` instead of a
  redirect. Middleware skips `auth.protect()` for `/api/trpc` so this works.
- **Locale** comes from the explicit `x-locale` header (context), which the
  service layer uses for localized errors/translations.
- **CORS** is env-driven via `CLIENT_API_ALLOWED_ORIGINS` (comma-separated).
  Needed for browser-based clients (Expo web); native RN does not enforce it.
- **Rate limiting** on `/api/trpc` uses the shared sliding-window limiter
  (`CLIENT_API_RATE_LIMIT` requests / 60s per IP), returning `429` +
  `Retry-After`.

## Uploads (outside core v1)

File uploads keep their existing route handlers (`/api/attachments/upload`,
`/api/workspaces/logo/upload`, `/api/estimate-requests/attachments/upload`,
`/api/issues/screenshots/upload`). They authenticate via `syncUserFromClerk()`
(Clerk `currentUser()`), so they **already accept Bearer tokens** the same way
the tRPC layer does — no change required for external clients. The
`/api/public/*` upload routes are intentionally unauthenticated.
