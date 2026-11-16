# LedgerVault

Small-business bookkeeping: track expenses with receipts, income (including
subscribers/clients), business documents, and financial-year reports for tax
time. Built with Next.js, Drizzle ORM, and Postgres.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Postgres** via Drizzle ORM — works with a local Postgres for development
  and [Neon](https://neon.tech) (free tier) for production. Receipts,
  invoices, and documents are stored as files directly in Postgres, so there's
  no separate storage service to configure.
- **Auth.js** (Credentials provider) for login — single business-owner
  account, no public sign-up.

## Local development

1. Have a Postgres database available (locally, or a free [Neon](https://neon.tech) project).
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `AUTH_SECRET`.
3. Install dependencies and run migrations:

   ```bash
   npm install
   npm run db:migrate
   ```

4. Create your login and seed default expense categories:

   ```bash
   # add ADMIN_EMAIL / ADMIN_PASSWORD to .env.local first, then:
   npm run seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

## Moving to Neon for production

1. Create a free project at [console.neon.tech](https://console.neon.tech).
2. Set `DATABASE_URL` (in your hosting platform's environment variables, e.g.
   Vercel) to the connection string Neon gives you.
3. Run `npm run db:migrate` once against that `DATABASE_URL` to create the
   schema, then `npm run seed` (with `ADMIN_EMAIL`/`ADMIN_PASSWORD` set) to
   create your login.
4. Since this is plain Postgres, moving the database again later (e.g. to
   Supabase) is a standard `pg_dump` / `pg_restore` — no app code changes.

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
