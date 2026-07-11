# Database migrations

How Esteo applies Prisma schema changes across Neon branches and deployment environments.

Related: [deployment.md](../architecture/deployment.md), [database.md](../architecture/database.md).

---

## Neon branches per environment

| Environment | Neon branch | Connection strings |
| --- | --- | --- |
| **localhost** | `development` | `DATABASE_URL` + `DIRECT_URL` in `.env` |
| **Vercel Preview** (`staging` git branch) | `staging` | `DATABASE_URL` + `DIRECT_URL` in Vercel **Preview** env |
| **Vercel Production** (`main`, at launch) | `production` | Vercel **Production** env |

Localhost and Preview use **separate** Neon branches so `prisma migrate dev` on your machine does not affect Preview data or schema until you promote migrations.

---

## Commands

| Command | Target DB | When to use |
| --- | --- | --- |
| `npm run prisma:migrate` | localhost (`development`) | Creating and applying migrations during feature work |
| `npm run prisma:migrate:staging` | Neon `staging` | Manual apply before first Preview switch, or debugging staging schema |
| `npm run prisma:seed:catalog` | localhost (`development`) | Platform catalog only (industry field definitions) |
| `npm run prisma:seed:catalog:staging` | Neon `staging` | Same - uses `DATABASE_URL_STAGING` / `DIRECT_URL_STAGING` |
| Vercel Preview build (`build:vercel`) | Neon `staging` | **Automatic** on every Preview deploy |

### Local staging migrate

Add to `.env` (never commit):

```env
DATABASE_URL_STAGING="postgresql://...pooler.../...?sslmode=require&pgbouncer=true"
DIRECT_URL_STAGING="postgresql://...direct.../...?sslmode=require"
```

Run:

```powershell
npm run prisma:migrate:staging
```

Runs `prisma migrate status` then `prisma migrate deploy` against the staging branch. Idempotent - exits quickly when there are no pending migrations.

---

## Automatic migrations on Vercel Preview

[`vercel.json`](../../vercel.json) sets `buildCommand` to `npm run build:vercel`, which runs [`scripts/vercel-build.mjs`](../../scripts/vercel-build.mjs):

1. If `VERCEL_ENV=preview` → `prisma migrate deploy` using Vercel **Preview** `DATABASE_URL` / `DIRECT_URL`
2. Then `next build`

**Vercel requirement:** both `DATABASE_URL` and `DIRECT_URL` must be set for the **Preview** environment and must point at the Neon **staging** branch. `DIRECT_URL` is required for migrations (non-pooler connection).

Production builds (`VERCEL_ENV=production`) skip migrate deploy until production launch.

Local `npm run build` is unchanged (`next build` only).

---

## Typical workflow

1. **Develop locally** on Neon `development`:
   ```powershell
   npm run prisma:migrate
   ```
   Creates migration files under `prisma/migrations/` and applies them to dev.

2. **Commit** migration files with your feature branch.

3. **Merge / push to `staging`** - Vercel Preview build runs `migrate deploy` on Neon `staging` automatically, then deploys the app.

4. **Optional manual step** before changing Vercel env vars for the first time:
   ```powershell
   npm run prisma:migrate:staging
   ```

`migrate deploy` applies **schema only** - it does not copy rows from `development` to `staging`. Seed platform catalog on staging:

```powershell
npm run prisma:seed:catalog:staging
```

For full dev workspace data use `npm run prisma:seed` (development only) or Neon branch restore.

---

## Scripts

| File | Purpose |
| --- | --- |
| [`scripts/prisma-migrate-deploy.mjs`](../../scripts/prisma-migrate-deploy.mjs) | Shared `migrate status` + `migrate deploy` helper |
| [`scripts/prisma-migrate-staging.mjs`](../../scripts/prisma-migrate-staging.mjs) | Local staging migrate via `_STAGING` env vars |
| [`scripts/seed-catalog.mjs`](../../scripts/seed-catalog.mjs) | Catalog seed; `--staging` uses `_STAGING` env vars |
| [`scripts/vercel-build.mjs`](../../scripts/vercel-build.mjs) | Preview-only migrate + Next.js build |

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Preview build fails at migrate step | Vercel Preview has `DATABASE_URL` + `DIRECT_URL` for Neon staging |
| `Missing DATABASE_URL_STAGING` locally | Add `_STAGING` vars to `.env` |
| Migration failed mid-deploy | Fix SQL/state, then `prisma migrate resolve` - see [Prisma docs](https://www.prisma.io/docs/guides/migrate/production-troubleshooting) |
| Preview app errors after deploy | Schema may be ahead of code or vice versa - check `_prisma_migrations` on staging vs `prisma/migrations/` in git |
