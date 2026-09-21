# Architecture

This document records architectural decisions for מרכז האופניים רמת ישי / CycleStore. Later sessions should extend this system rather than replace it.

## Stack

- Next.js 16 App Router, React 19, TypeScript strict
- PostgreSQL via Drizzle ORM
- Better Auth for identity/sessions/passwords
- `postgres` (postgres.js) driver so local Docker Postgres and Neon both work, including transactions
- Vitest + PGlite for domain/integration tests
- Playwright for public smoke tests
- Vercel / Neon / Vercel Blob / GitHub are planned, not provisioned until explicitly approved

## Layout

```text
src/
  app/                 HTTP routes, layouts, metadata, Route Handlers
  components/          UI only; no authorization logic
  domain/              business rules (catalog, cart, money, inventory, authz)
  db/                  schema, client, seed
  server/              server actions, queries, authorization helpers
  lib/                 auth factory, env, logging, errors
```

## Language

- All user-facing UI copy is Hebrew
- `html lang="he" dir="rtl"`
- Code, schema, comments, and docs are English
- Layout uses CSS logical properties (`inline-start` / `inline-end`) rather than LTR mirroring

## Auth and authorization

These are separate layers:

1. Better Auth owns identity, password hashing (scrypt), sessions, cookies, rate limits
2. `user_profiles` owns `ADMIN` / `CUSTOMER` and `mustChangePassword`
3. Server Actions and admin layouts call `requireAdminSession()` / `requireAdminPage()`
4. `src/proxy.ts` only checks for a session cookie on `/admin/*` and is not a security boundary

Public registration is disabled. Google login is wired as a dormant Better Auth social provider and activates only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exist.

### Bootstrap password conflict

The required bootstrap password `123456` is shorter than the replacement-password policy (12+ characters, letter + number). Resolution:

- Seed hashes the bootstrap password through Better Auth's hasher and inserts it with the internal adapter, bypassing sign-up validation
- Sign-in still accepts the bootstrap hash
- `mustChangePassword` blocks the rest of `/admin` until a strong password is set
- After change, the bootstrap password is no longer valid

The bootstrap password must never appear in client bundles. It is supplied through `ADMIN_BOOTSTRAP_PASSWORD` for seed/tests only.

## Catalog

- Categories use a parent pointer plus a `category_closure` table
- Hierarchy writes are transactional
- Products belong to many categories
- Current selling price lives on `products.price_amount numeric(12,2)` in ILS
- `product_price_history` records price changes without introducing sale/variant subsystems yet
- Stock is authoritative in PostgreSQL; guest cart add does **not** decrement stock
- Inventory writes create `inventory_movements` rows and reject negative quantities

## Cart

- Guest cart stores `{ productId, quantity }` in `localStorage`
- Displayed prices and availability always come from a server revalidation
- Checkout/payment is intentionally absent. `src/domain/checkout` is the extension point for later credit card / Google Pay / Apple Pay

## Media

- Binary files are never stored in Postgres
- `media` stores URL + metadata
- `MEDIA_DRIVER=local` writes to `storage/uploads` and serves `/media/[key]`
- Vercel Blob is a stub until explicitly approved

## Caching

- Public catalog/content uses `unstable_cache` with tags
- Admin mutations call `updateTag` so price/stock/content changes are not served stale
- Cart validation always hits the database

## Environments

| Environment | Git | Database | Host |
| --- | --- | --- | --- |
| Local | feature branches | Docker Postgres or Neon development branch | `next dev` |
| Preview | pull request | Neon preview branch (when approved) | Vercel Preview |
| Production | `main` | Neon production branch only | Vercel Production |

Preview must never write to the production database. Production must never use preview credentials.

## Future extensions (do not rewrite)

- Customer accounts: same Better Auth instance, `user_profiles.role = CUSTOMER`, enable email/password and/or Google
- Checkout: new domain module + orders table referencing `products.id`; add reservation/concurrency then
- Variants: new `product_variants` table referenced by cart lines; keep `products` as the parent
- Sale pricing: nullable `sale_price_amount` or additional `product_prices` rows; keep current amount as list price
