# Agrilink

A marketplace where farmers sell crops directly to buyers: no middlemen, fairer prices, fresher produce.

- **Buyers** browse and filter the catalogue, build a cart, check out (cash on delivery), track each item of an
  order, and review what they received.
- **Farmers** list products with photos, manage stock, and fulfil the order lines that contain their products
  (accept → ship → deliver, or cancel; cancelling returns the stock). They are notified of new orders and reviews.

> **Maintaining this project?** Read [`CHANGES.md`](CHANGES.md): it explains every change, why it was made,
> the architectural decisions, and the manual steps required after pulling.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | React 18, TypeScript (strict), Vite, Tailwind + shadcn/ui, TanStack Query, React Router 7, react-hook-form + zod |
| Auth | Firebase Authentication (email + password) |
| API | Node + Express 5 (`backend/`), zod validation, helmet, rate limiting |
| Database | Supabase Postgres + Storage, accessed **only** by the API |
| Hosting | Vercel (static frontend + the API as a serverless function) |

## How security works

1. The browser signs in with Firebase and sends the ID token as `Authorization: Bearer …`.
2. The API verifies the token's signature, issuer, audience and expiry against Google's public keys
   (`backend/lib/firebaseVerifier.js`; no secret needed, just the project id).
3. The caller's **role** (Buyer / Farmer) comes from the `Profile` table, chosen once at sign-up and never editable.
4. Every write checks the role and **ownership** (e.g. `UPDATE … WHERE id = ? AND "sellerId" = <caller>`).
   Seller/buyer identity, prices and totals are never taken from the request body.
5. Orders are created by the `place_order` SQL function in one transaction: prices come from the `Product` table,
   stock is decremented atomically (it can't go negative or be oversold), and either the whole order is saved or none of it.
   Item status changes go through `update_order_item_status`, which enforces who may do which transition.
6. All tables have **Row Level Security enabled with no policies**, so the public Supabase anon key can't read or write anything.
   Only the API, using the `service_role` key, touches the database.

## Getting started

### 1. Supabase

1. Create a project, open **SQL Editor**, and run all of [`backend/schema.sql`](backend/schema.sql).
   It's idempotent: safe on a fresh project and it upgrades earlier versions in place. It also creates the
   `product-images` storage bucket.
2. Project Settings → API: copy the project URL and the **service_role** key.

### 2. Firebase

Create a web app in your Firebase project and enable **Email/Password** sign-in.

### 3. Environment

```bash
cp .env.example .env              # VITE_FIREBASE_* (public, ships in the browser bundle)
cp backend/.env.example backend/.env   # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIREBASE_PROJECT_ID (secret, server only)
```

### 4. Run

```bash
npm install && npm install --prefix backend
npm run dev:all        # web on :8080, API on :5001
```

The API uses port **5001** because macOS reserves 5000 for AirPlay Receiver.
Without a `.env` the site still loads, and signed-out browsing shows a clear "not configured" message instead of crashing.

## Demo mode

Set `VITE_MOCK=true` in `.env` (restart `npm run dev`) to run the storefront with **no API, database or Firebase**.
`src/lib/api.ts` then answers every request from `src/mocks/api.ts` instead of calling the network. `VITE_MOCK=false` (the default
in `.env.example`) uses the real API, and nothing in the mock code runs.

- **Catalogue:** 40 products in 10 categories (`src/mocks/data.ts`) with ratings, reviews, stock levels and an optional list price.
  Photos are local files in `public/mock/products/`; credits are in [`public/mock/CREDITS.md`](public/mock/CREDITS.md). Replace them before a public launch.
- **Sign-in:** the login page shows *Continue as demo buyer* / *Continue as demo farmer* (no password). The demo farmer
  is "Green Valley Farms" and owns six of the products.
- **Mocked and working:** browse, search, filter, basket, checkout (stock is reduced), orders and status changes
  (accept, ship, deliver, cancel), reviews, notifications, farmer listings (add, edit, stock, delete, image upload) and both dashboards.
- **Not mocked:** real authentication, password reset, email, payments. The contact form just succeeds.
- **Persistence:** demo changes live in the browser's localStorage. *Reset demo data* in the footer restores the seed data.
- **Discounts and "Best sellers":** product cards show a "% OFF" tag and a struck-through price only when a product has the optional `mrp`
  field above its `price`. The real API does not send `mrp`. The "Best sellers" rail on the home page is demo-only, because the real API cannot sort by popularity.

## Design system

The look is a "market ledger": unbleached paper, ink, hairline rules, and colour used only for meaning.

- **Tokens** live in `src/index.css` (colours as HSL variables, radius, header height) and `tailwind.config.ts` (fonts, type scale, motion).
  Use the named materials (`paper`, `ink`, `field` = go/success, `turmeric` = pending/attention, `chili` = error/destructive, `indigo` = in transit), not raw colours.
- **Type:** Source Serif 4 for names and headlines, IBM Plex Sans for UI, IBM Plex Mono for every figure and label.
  Use `.figure` on prices, quantities, dates and order numbers, and `.eyebrow` for small uppercase labels.
- **Patterns:** ruled sections instead of cards (`SectionHead`, `PageHead`), `FigureStrip` for headline numbers, `OrderTrack` and `StatusBadge`
  for status (shape plus text, never colour alone), `Plate` and `FieldScene` (`src/components/Art.tsx`) for illustration, `Brand.tsx` for the mark.
- **Phones:** a four-tab bar replaces the header nav below `md`, and filters open as a bottom sheet.

## Tests

```bash
npm test               # 53 backend tests: API, fuzzing, token verification, and the SQL on a real Postgres engine
npm run typecheck
npm run lint
```

`backend/test/` covers authentication, roles, ownership, validation, uploads, reviews, notifications and rate
limiting against an in-memory stand-in for Supabase, and `sql.test.js` runs `schema.sql` (including the upgrade
from the original schema) and every SQL function against a real Postgres engine (PGlite).

## Deploying to Vercel

Set these in the Vercel project: all `VITE_FIREBASE_*` variables, plus `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` and `FIREBASE_PROJECT_ID`. Optional: `CORS_ORIGINS`, `SHIPPING_PER_FARMER`
(default 40, charged once per farmer), `VITE_CURRENCY` / `VITE_LOCALE` (defaults: `INR` / `en-IN`),
`VITE_CONTACT_EMAIL` / `VITE_CONTACT_PHONE` / `VITE_CONTACT_ADDRESS` (shown on the Contact and Privacy pages).
`vercel.json` also sets security headers including a Content-Security-Policy.

> Rate limits are counted in memory, per serverless instance, so they slow abuse but aren't a hard global cap.
> Use a shared store (e.g. Upstash Redis) if you need strict limits.

## Known limitations

Payment is cash on delivery (no online gateway), notifications are in-app only (no email/SMS), and there is no
admin area. Full list with reasoning: [`CHANGES.md` §12](CHANGES.md#12-known-limitations).
Existing Firebase accounts created before this version are asked to finish a one-time profile step on next sign-in.
