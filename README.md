# מרכז האופניים רמת ישי

Hebrew-first catalog website for **מרכז האופניים רמת ישי**, built as a production foundation for later checkout and customer accounts.

Read [ARCHITECTURE.md](./ARCHITECTURE.md) and [docs/SCHEMA.md](./docs/SCHEMA.md) before changing core patterns.

## Current status

Local application, schema, admin CMS, guest cart, and tests are implemented.

**Not done automatically (needs your approval):**

- creating or pushing a GitHub repository
- creating Neon projects/branches
- creating a Vercel project, Blob store, domains, or production env vars
- connecting GitHub ↔ Vercel ↔ Neon

A Git remote named `origin` already exists in the local `.git/config`. This project will not push or change GitHub until you say so.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 with design tokens
- Drizzle ORM + PostgreSQL
- Better Auth (username/password, HttpOnly cookies, rate limiting)
- Local media storage (Vercel Blob later)

## Local setup

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
copy .env.example .env.local
```

Set at least:

```env
DATABASE_URL=postgres://cyclestore:cyclestore_dev@localhost:5432/cyclestore
BETTER_AUTH_SECRET=<run openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_BOOTSTRAP_USERNAME=admin
ADMIN_BOOTSTRAP_EMAIL=admin@internal.local
ADMIN_BOOTSTRAP_PASSWORD=123456
MEDIA_DRIVER=local
```

`ADMIN_BOOTSTRAP_PASSWORD` is the temporary bootstrap password. Do not put it in client code or production after the first password change.

### 3. Local database

This uses Docker Postgres on your machine. It does not create Neon.

```bash
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Admin is at `/admin` and is not linked from the public menus.

## Admin bootstrap

1. Sign in at `/admin/login` with username `admin` and the temporary password `123456`.
2. The app forces an immediate password change (minimum 12 characters, letter + number).
3. After that, `123456` no longer works.
4. Later password changes live under **הגדרות מנהל → שינוי סיסמה**.

Passwords are stored only as Better Auth scrypt hashes.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (domain + PGlite integration) |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run db:generate` | Create Drizzle SQL migrations |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Categories, CMS placeholders, admin user |
| `npm run db:studio` | Drizzle Studio |

## Environment variables

See `.env.example`. Never commit `.env` or `.env.local`.

Production requires `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥ 32 chars), and `BETTER_AUTH_URL`. Preview and production credentials must stay isolated.

## Database workflow

1. Change `src/db/schema/*`
2. `npm run db:generate`
3. Review the SQL in `drizzle/`
4. Apply on a non-production database: `npm run db:migrate`
5. Seed if needed: `npm run db:seed`
6. Destructive migrations must be reviewed with you before production

### Neon branching (after approval)

- Production Neon branch → Vercel Production only
- Development branch → local `DATABASE_URL`
- Preview branch → Vercel Preview / pull requests
- Never point Preview at the production database for writes

## Git workflow

- `main` = production
- Work on feature branches
- Merge significant work through pull requests
- Do not develop against production database credentials

## Vercel workflow (after approval)

- Production deploys from `main`
- Other branches create Preview deployments
- Do not auto-promote untested Previews
- Production env vars must never include preview DB URLs

## Media

- Local files: `storage/uploads`, URLs `/media/<file>`
- Postgres stores metadata and URLs only
- Set `MEDIA_DRIVER=vercel-blob` only after Blob is approved and `BLOB_READ_WRITE_TOKEN` exists

## Pricing

- ILS only in v1
- `numeric(12,2)`, never floats
- Display via `Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' })`
- Cart totals are recalculated on the server from current catalog prices

## Adding Google authentication later

1. Create a Google OAuth client
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Restart the app — `src/lib/auth-factory.ts` already registers the Google provider when those vars exist
4. Keep public customer sign-up disabled until customer accounts are intentionally launched

## Adding registered customers later

- Keep Better Auth
- Insert `user_profiles.role = 'CUSTOMER'`
- Enable the desired sign-in methods
- Add a server-side cart table keyed by `user_id`; reuse `src/domain/cart`

## Adding checkout later

- Implement `src/domain/checkout`
- Add orders/payments tables referencing product UUIDs
- Reserve stock in a transaction at checkout, not when adding to a guest cart
- Planned methods: credit card, Google Pay, Apple Pay — no provider is integrated yet

## Backup / recovery

Until Neon is approved, take logical dumps of the local Postgres volume before destructive work:

```bash
docker compose exec postgres pg_dump -U cyclestore cyclestore > backup.sql
```

After Neon: use Neon PITR / snapshots on the production branch, and never restore production onto a preview branch without an explicit decision.

## Health check

`GET /api/health` returns `{ status, database, time }` for deployment verification.
