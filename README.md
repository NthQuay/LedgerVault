# LedgerVault

Small-business bookkeeping: track expenses with receipts, income (including
subscribers/clients), business documents, and financial-year reports for tax
time. Built with Next.js, Drizzle ORM, and Postgres.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Postgres on [Neon](https://neon.tech)**, accessed via Drizzle ORM and the
  `@neondatabase/serverless` HTTP driver (`drizzle-orm/neon-http`). This talks
  to Neon over plain HTTPS rather than a raw Postgres TCP connection, which is
  what lets it run on serverless/edge hosting (and on networks that only allow
  outbound HTTPS). Receipts, invoices, and documents are stored as files
  directly in Postgres, so there's no separate storage service to configure.
- **Auth.js** (Credentials provider) for login — single business-owner
  account, no public sign-up.
- Neon project is managed via `neon.ts` + the Neon CLI (`neon deploy`), linked
  in `.neon` (gitignored, machine-specific).

## Local development

1. Install dependencies: `npm install`
2. This project is linked to a Neon project (see `neon.ts`). Get a connection
   string for your own branch — either run `neon checkout dev --create` to
   make a personal dev branch, or use the CLI's `neon env pull` — and set
   `DATABASE_URL` in `.env.local`. Because the app uses Neon's HTTP driver,
   `DATABASE_URL` must point at an actual Neon endpoint; a local/non-Neon
   Postgres won't work with this driver.
3. Set `AUTH_SECRET` in `.env.local` (see `.env.example` for how to generate one).
4. Run migrations: `npm run db:migrate`
5. Create your login and seed default expense categories:

   ```bash
   # add ADMIN_EMAIL / ADMIN_PASSWORD to .env.local first, then:
   npm run seed
   ```

6. Start the dev server: `npm run dev`

If your network only allows outbound HTTPS through an explicit proxy (as in
some sandboxed dev containers), Node's built-in `fetch` may not pick up
`HTTPS_PROXY` automatically — prefix commands that hit the database
(`db:migrate`, `seed`, `dev`, `build`, `start`) with `NODE_USE_ENV_PROXY=1` if
you see `fetch failed` errors. This is not needed on a normal machine or
standard hosting platform.

## Deploying

Set `DATABASE_URL` and `AUTH_SECRET` as environment variables on your hosting
platform (e.g. Vercel), pointing `DATABASE_URL` at your production Neon
branch. Run `npm run db:migrate` once against that branch before first
deploy. Since the connection is plain HTTPS, this also works unmodified on
edge/serverless runtimes.

## What's here

- **Dashboard** — current financial-year income vs. expenses, net profit,
  active subscriber/client count and estimated recurring revenue, recent
  activity, and upcoming document-expiry warnings.
- **Expenses** — add/edit/delete, categorised, with an optional receipt or
  invoice upload (PDF or image, stored in the database).
- **Income** — a ledger of money received, optionally linked to a
  **Subscriber/client** record (for recurring or expected income you haven't
  been paid yet).
- **Business & Documents** — business profile, business numbers (ABN, ACN,
  etc. — add as many labelled numbers as you need), a document vault with
  optional expiry dates (insurance, registrations, licences), and the
  financial-year start month setting.
- **Reports** — per-financial-year profit & loss summary, expense breakdown
  by category, and CSV export of both expenses and income for your
  accountant/tax return.

Every expense and income entry is tagged with its financial year, computed
from the "financial year starts in" setting (Business & Documents page,
default July for the Australian tax year).

## Notes / next steps for a non-MVP version

- Currency formatting is hardcoded to AUD. If needed, make this a setting.
- Auth is single-user by design (one business, one login). Multi-user support
  would need a proper signup flow and per-user data scoping.
- File size cap is 8MB per upload, PDF/JPEG/PNG/WEBP/HEIC only — see
  `src/lib/files.ts` to change.
