# CHANGES: everything that was changed, and why

This file is the handover document for the 2026 overhaul of Agrilink. It lists **every** change (major and minor),
**why** it was made, and **how it helps**. If you are new to the codebase, read sections 1-3 first, then use
sections 4-9 as a reference when you touch a given area.

- [1. Summary](#1-summary)
- [2. Decision log](#2-decision-log) (why the architecture looks the way it does)
- [3. Manual steps after pulling this code](#3-manual-steps-after-pulling-this-code)
- [4. Security fixes](#4-security-fixes)
- [5. Backend](#5-backend)
- [6. Database](#6-database)
- [7. Frontend](#7-frontend)
- [8. Tooling, config, dependencies, repo hygiene](#8-tooling-config-dependencies-repo-hygiene)
- [9. Content and legal](#9-content-and-legal)
- [10. Tests and how to run them](#10-tests-and-how-to-run-them)
- [11. Deleted files](#11-deleted-files)
- [12. Known limitations](#12-known-limitations)
- [13. Complete file index](#13-complete-file-index)
- [14. Deep-review pass: defects found afterwards and fixed](#14-deep-review-pass-defects-found-afterwards-and-fixed)

---

## 1. Summary

**Before:** a Lovable-generated demo. The browser talked to an unauthenticated Express API that trusted whatever
the client sent (identity, prices, totals); the Supabase key was public in the bundle; dashboards, orders and
analytics were hard-coded sample data; many buttons did nothing; the contact form silently discarded messages;
the default API port collided with macOS AirPlay so data pages were empty on a Mac.

**After:** a working marketplace with a secure architecture:

| Capability | State |
| --- | --- |
| Sign up / sign in / forgot password (Firebase) with a one-time role choice | built |
| Server-verified identity, roles and ownership on every write | built |
| Product catalogue: server-side search, filters, sorting, pagination | built |
| Farmer listings: add, edit, restock, delete, **photo upload** | built |
| Cart with live prices/stock, **per-farmer shipping**, multi-farmer checkout | built |
| Atomic order placement (no overselling), per-item status workflow, cancel + restock | built |
| **Payments:** cash on delivery, tracked as Due / Paid | built (gateway is a future swap) |
| **Verified-purchase reviews** with rating aggregates | built |
| **In-app notifications** (new order, status change, review) with bell | built |
| Contact form that stores messages | built |
| Privacy Policy and Terms of Service pages | built |
| Tests: 53 backend (API, fuzzing, token verification, real-Postgres SQL), strict TypeScript, 0 lint errors, axe accessibility audit clean | built |

---

## 2. Decision log

Each decision is written so you can overturn it knowingly.

| # | Decision | Alternatives considered | Why this one |
| --- | --- | --- | --- |
| D1 | **Firebase Auth stays; the API verifies Firebase ID tokens** with Google's public keys (`jose`). | Switch to Supabase Auth; add `firebase-admin`. | Firebase was already in the product. Verifying the JWT needs only the project id (no service-account secret), so the deploy has one less secret to leak. |
| D2 | **All database access goes through the API** (service-role key) and every table has **Row Level Security enabled with no policies**. | Let the browser query Supabase with RLS policies. | One enforcement point (the API) that is unit-testable. The public anon key becomes useless to an attacker. |
| D3 | **Roles live in a Supabase `Profile` table**, chosen once, immutable. | Keep roles in client-writable Firestore. | Firestore docs were writable by the user themselves, so anyone could make themselves a "Farmer". |
| D4 | **Identity is the Firebase UID (string)**, not a hashed integer. | Keep the 32-bit hash. | The hash could collide, letting two users share an identity. `sellerId` / `buyerId` columns were migrated from integer to text. |
| D5 | **Orders are created in one SQL function (`place_order`)**; prices come from the DB. | Do read-modify-write in Node. | A single transaction cannot oversell or leave half an order. The old code read stock then wrote it (race), and trusted `totalAmount` from the browser. |
| D6 | **Status lives on each order *line* (`OrderItem.status`)**, the order's status is derived. | One status per order. | An order can span several farmers; each must manage only their own items. A single status would let one farmer change another's. |
| D7 | **Payments = cash on delivery.** `Order.paymentMethod = 'COD'`; payment is *Due* until every live line is Delivered, then *Paid*. | Razorpay/Stripe. | A real gateway needs live keys and a webhook that cannot be tested honestly here. COD is truthful, needs no secrets, and the column lets a gateway be added later without reshaping orders. |
| D8 | **Shipping is charged once per farmer** (`SHIPPING_PER_FARMER`, default 40). | One flat fee per order. | Each farmer ships separately, so a flat fee under-charged multi-farmer orders. |
| D9 | **Reviews: verified purchase only**, one per purchased line, enforced in SQL (`submit_review`). Product rating/count are maintained in the same transaction. | Anyone can review. | Prevents fake reviews and keeps aggregates consistent. |
| D10 | **Notifications are in-app** (a `Notification` table + bell), created inside the same SQL transactions as the events. | Email (Resend/SendGrid). | Email needs a provider key and domain verification; in-app needs neither, is atomic with the event, and is fully testable. An email sender can read the same table later. |
| D11 | **Image upload goes browser → API → Supabase Storage**; the API **sniffs magic bytes** and stores under `<uid>/<uuid>.<ext>`. | Signed upload URLs straight from the browser. | The browser never needs a Supabase SDK or key; the file type is verified by content (not the spoofable Content-Type); SVG/HTML are rejected so no script can be hosted. |
| D12 | **Currency defaults to INR (`en-IN`)**, configurable via `VITE_CURRENCY`/`VITE_LOCALE`. | Keep USD. | The product targets India (government schemes in ₹ on the Resources page). Prices in the DB are plain numbers, so this changes display only. |
| D13 | **Cart stores only `{productId, quantity}`**; price and stock are fetched live. | Store full products in `localStorage`. | `localStorage` is user-editable; storing prices there invites price tampering and shows stale prices. |
| D14 | **TypeScript `strict: true`.** | Leave `strict: false`. | `strict: false` hid whole classes of bugs and made Zod's types wrong. The codebase now compiles cleanly under strict. |
| D15 | **Role-based route guards + API enforcement.** | Guard only in the UI. | UI guards are convenience; the API re-checks everything, so bypassing the UI gains nothing. |
| D16 | **Honest content only.** Fabricated testimonials, an invented founding story, placeholder phone/address and unsubstantiated claims were removed. | Leave them. | They are misleading to real users and a liability. Contact details are now configuration. |

---

## 3. Manual steps after pulling this code

> Do these in order. Until step 1 is done, the database is still reachable with the old public key.

1. **Supabase → SQL Editor: run all of `backend/schema.sql`.** It is idempotent and keeps existing data. It
   enables Row Level Security, creates the new tables and functions, upgrades id columns, and creates the
   `product-images` storage bucket.
2. **Rotate the Supabase anon key** (Project Settings → API). The old key was committed to git history.
3. **Set environment variables** (see `.env.example` and `backend/.env.example`):
   - Frontend: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
   - Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_PROJECT_ID`.
   - Optional: `VITE_CONTACT_EMAIL|PHONE|ADDRESS`, `VITE_CURRENCY`, `VITE_LOCALE`, `SHIPPING_PER_FARMER`, `CORS_ORIGINS`.
4. **Existing listings are orphaned.** Their `sellerId` holds an old hashed number, so no Firebase user owns them.
   Either delete them or reassign, for example:
   `update "Product" set "sellerId" = '<firebase-uid>', "sellerName" = '<name>' where "sellerId" = '<old number>';`
5. **Existing Firebase users** are asked to finish a one-time profile step (role, phone, address) on next sign-in.
6. **After deploying to Vercel**, smoke-test sign-in and an image upload; the Content-Security-Policy in
   `vercel.json` was verified on a local production build but not on Vercel itself.
7. **Have a lawyer review** `src/pages/Privacy.tsx` and `src/pages/Terms.tsx` before a public launch. They are
   accurate descriptions of what the app does, written in plain language, but they are not legal advice.

---

## 4. Security fixes

| Problem found | Fix | Why it matters |
| --- | --- | --- |
| Supabase URL + anon key hard-coded in `src/lib/supabaseClient.ts` (despite a commit claiming they were moved). | File deleted; the browser no longer talks to Supabase at all. RLS enabled on all tables. | With RLS off and a public key, anyone on the internet could read/write the database directly. |
| API had **no authentication**. | `backend/middleware/auth.js` + `backend/lib/firebaseVerifier.js`: every write needs a verified Firebase token. | Previously anyone could create products, change anyone's stock, read all orders. |
| API **trusted client-supplied identity** (`sellerId`, `buyerId`). | Identity is read from the token; request-body identity fields are ignored (tested). | Prevents impersonation. |
| API **trusted client-supplied `totalAmount`** and prices. | Totals are computed in SQL from the `Product` table. | A buyer could previously pay 1 cent for anything. |
| Stock decrement was read-then-write (race) and could oversell. | Single atomic `UPDATE … WHERE "quantityAvailable" >= qty` inside `place_order`. | No overselling under concurrency; failed orders roll back fully. |
| User ids were a 32-bit hash of the Firebase UID. | Real UID strings; DB columns migrated to `text`. | Hash collisions would merge identities. |
| Roles stored in client-writable Firestore. | Server-side `Profile` table, role immutable. | Prevents self-promotion to Farmer. |
| Raw Supabase error messages returned to clients (`res.json({error: error.message})`). | Central error handler returns generic messages; details are logged only. | Error text can leak schema and infrastructure details. |
| User text interpolated into a PostgREST `.or()` filter. | Search terms are stripped to letters/digits/spaces; all query params validated with Zod. | Prevents filter injection. |
| `cors()` allowed every origin; no body size limit. | CORS only for configured origins; JSON body limit 20 KB; helmet security headers; rate limits. | Reduces CSRF-style and abuse surface. |
| No input validation. | Zod schemas for every body/query (`backend/lib/schemas.js`) mirrored on the client. | Rejects negative prices, decimals in quantities, non-https images, oversize text. |
| Open redirect: `react-router-dom` 6 advisory + a `?from=` redirect that only blocked `//`. | Upgraded to React Router 7; redirect target must match `^/(?![/\\])`. | `/\evil.com` style redirects are refused. |
| Image upload could host scripts (SVG/HTML). | Magic-byte sniffing allows only JPEG/PNG/WebP; 3 MB cap; unguessable names. | Prevents stored-XSS via "images". |
| CSV export could inject spreadsheet formulas. | Cells starting with `= + - @` are prefixed with `'`. | Prevents formula injection when a farmer opens an export. |
| localStorage cart is user-editable. | Cart is sanitised on load (integers, positive, ≤ 1000) and prices come from the server. | No price/quantity tampering. |
| Third-party script injected in production (`cdn.gpteng.co`) and `lovable-tagger`. | Removed from `index.html`, `vite.config.ts`, `package.json`. | Removes an unaudited supply-chain dependency. |
| 44 npm vulnerabilities. | `npm audit fix` + router 7; remaining are build-tooling (Vite/Tailwind/glob) and not shipped to users. Backend **production** deps: 0 vulnerabilities. | Smaller attack surface. |
| No security headers on the site. | `vercel.json`: Content-Security-Policy, nosniff, HSTS, Referrer-Policy, Permissions-Policy, frame-ancestors none. | Mitigates XSS, clickjacking, MIME sniffing. |
| Contact form `onSubmit` showed fake success. | Real endpoint with validation, honeypot and a tight rate limit. | No silent message loss; spam resistance. |

---

## 5. Backend

All under `backend/`. Run with `npm run dev --prefix backend`; tests with `npm test --prefix backend`.

### Structure
| File | What / why |
| --- | --- |
| `index.js` | Entry point only: builds the app, listens locally, exports the app for Vercel. Default port **5001** (macOS reserves 5000 for AirPlay, which made the old API unreachable on Macs). |
| `app.js` | `createApp({supabase, verify, limits})`: **dependency-injected** so tests run without a real database or Firebase. Wires helmet, CORS, JSON limit, rate limits, routes, 404 and the error handler. Returns a clear 503 if env vars are missing instead of crashing. |
| `config.js` | Reads and validates environment variables in one place; reports which are missing. |
| `supabaseClient.js` | Creates the service-role client with sessions disabled (server only). |
| `lib/errors.js` | `ApiError` helpers (`badRequest`, `notFound`, …) and `dbError()` that logs details but returns a generic message. |
| `lib/schemas.js` | Every Zod schema (products, orders, profile, reviews, contact, queries) plus `parse()`. Single source of truth for validation. |
| `lib/firebaseVerifier.js` | Verifies Firebase ID tokens (RS256, issuer, audience, expiry) using Google's JWKS. The key set is injectable for tests. |
| `middleware/auth.js` | `authenticate`, `loadProfile`, `requireRole`. |

### Routes
| Route file | Endpoints | Notes |
| --- | --- | --- |
| `routes/categories.js` | `GET /api/categories` | `productCount` is now computed from real in-stock products (the stored value was a stale seed). Cached 60 s. |
| `routes/products.js` | `GET /` (filters: `q`, `categoryIds`, `productionType`, `minPrice`, `maxPrice`, `inStock`, `sellerId`, `ids`, `sort`, pagination), `GET /mine`, `GET /:id`, `POST /`, `PATCH /:id`, `PUT /:id/stock`, `DELETE /:id` | Ownership is part of the `WHERE` clause (no check-then-act gap). `inStock` is derived from quantity, never client-set. |
| `routes/orders.js` | `GET /`, `GET /:id`, `POST /`, `PATCH /items/:itemId/status` | Buyers see their purchases; farmers see orders containing their items, **only their own lines**. Presents derived order status, `paymentMethod`, `paymentStatus`. Maps SQL exceptions to friendly 4xx errors. |
| `routes/profile.js` | `GET/POST/PATCH /api/profile` | Role chosen once at `POST`; `PATCH` cannot change it. |
| `routes/reviews.js` | `GET /?productId=`, `GET /mine`, `GET /eligible?productId=`, `POST /`, `DELETE /:id` | Public list hides reviewer UIDs. Posting goes through `submit_review`. |
| `routes/notifications.js` | `GET /`, `POST /read-all`, `PATCH /:id/read` | Always scoped to the caller. |
| `routes/uploads.js` | `POST /api/uploads/product-image` (farmers) | Raw bytes, magic-byte sniffing, size cap, unique path. |
| `routes/contact.js` | `POST /api/contact` | Public; honeypot field; 5 requests/hour/IP (counting rejected ones). |
| (in `app.js`) | `GET /api/config`, `GET /api/health` | `config` exposes `shippingPerFarmer` and `paymentMethod` so the UI shows exactly what the server will charge. |

### Behaviour worth knowing
- Order status is derived: all cancelled → Cancelled; all live lines delivered → Delivered; all pending → Pending; all shipped/delivered → Shipped; else Processing.
- `currentTotal` (UI) = live lines + shipping, `0` when everything is cancelled; the original total is shown as "Originally …".
- Farmers cannot place orders; buyers cannot create products (both enforced server-side).

---

## 6. Database

Everything is in one idempotent file: `backend/schema.sql`. Run it as many times as you like.

| Change | Why |
| --- | --- |
| RLS enabled, no policies, on every table | Locks out the public key (see D2). |
| `Profile` table | Role + contact details keyed by Firebase UID (D3, D4). |
| `Product."sellerId"`, `"farmerId"`, `Order."buyerId"` converted `integer → text` | Real UIDs (D4). Existing rows are cast, not lost. |
| `OrderItem` table | Per-line product/price snapshot, seller, status (D6). Snapshots mean history survives product edits/deletes. |
| `Order."shippingAmount"`, `"shippingAddress"`, `"contactNumber"`, `"paymentMethod"` | Farmers need the delivery address; shipping/payment are recorded per order. Address is snapshotted so later profile edits don't change past orders. |
| `Order.status` check constraint dropped | The old constraint rejected "Processing"; status now lives on `OrderItem`. |
| `CHECK (price >= 0)`, `CHECK ("quantityAvailable" >= 0)`, status/rating/quantity checks | The database refuses impossible data even if the API had a bug. |
| Indexes on seller, category, buyer, order, review, notification | Query speed as data grows. |
| Category seed expanded to the 10 categories the UI shows; identity sequence advanced | The old seed had 7, and inserting a new category would collide with seeded ids. |
| `place_order(...)` | Atomic order + stock + per-farmer shipping + farmer notifications (D5, D8). |
| `update_order_item_status(...)` | Enforces who may make which transition, returns stock on cancel, row-locked to prevent double restock, notifies the other party. Allowed: seller `Pending→Processing/Cancelled`, `Processing→Shipped/Cancelled`, `Shipped→Delivered`; buyer `Pending→Cancelled`. |
| `Review` table + `submit_review`, `delete_review`, `refresh_product_rating` | Verified-purchase reviews with consistent aggregates (D9). `UNIQUE("orderItemId")` guarantees one review per purchase. |
| `Notification` table | In-app notifications (D10). |
| `ContactMessage` table | Stores contact-form messages (read them in the Supabase table editor). |
| `product-images` storage bucket (public read, 3 MB, JPEG/PNG/WebP) | Where uploaded photos live; created only when Supabase Storage exists, so the script also runs on plain Postgres. |
| `REVOKE … FROM public, anon, authenticated; GRANT … TO service_role` on every function | Functions are callable only by the API. |

Verified by `backend/test/sql.test.js` against a real Postgres engine (PGlite), including the v1 → v3 upgrade with data.

---

## 7. Frontend

### Architecture changes
| File | What / why |
| --- | --- |
| `src/lib/firebase.ts` (replaces `firebaseConfig.ts`) | Auth only (Firestore dropped). If env vars are missing the site still loads and shows a clear message instead of a blank page. |
| `src/lib/api.ts` | One fetch wrapper: attaches the Firebase token, refreshes once on 401, throws typed `ApiError`s, **rejects non-JSON "success" responses** (a CDN/HTML error page used to crash the UI), supports raw file upload. |
| `src/lib/queries.ts` | TanStack Query hooks (`useProducts`, `useOrders`, `useReviews`, `useNotifications`, …). Replaces the same `fetch` code that was copy-pasted in ~10 files. |
| `src/context/AuthContext.tsx` | Rewritten. Explicit states (`loading`, `signedOut`, `needsProfile`, `ready`, `error`) so a page refresh no longer bounces a signed-in user to /login. `signUp` creates the account and the profile together. |
| `src/context/CartContext.tsx` | Rewritten (D13). Per-user carts, guest cart merged on sign-in, tamper-proof loading, stock-capped `addItem`, multi-tab sync. |
| `src/components/RequireAuth.tsx` + `App.tsx` | Role-based route guards; every page except the home/browsing pages is **lazy-loaded** (main JS dropped from 1.39 MB to ~0.62 MB). |
| `src/components/ErrorBoundary.tsx` | A rendering bug now shows a recovery screen, not a white page. |
| `src/components/PageState.tsx` | Shared spinner / empty / error states so the app feels consistent. |
| `src/types/index.ts` | Types matching the new API (`Profile`, `OrderItem`, `Review`, `AppNotification`, …). |
| `src/data/catalog.ts`, `src/data/terrain.ts` | One copy of units/production types and terrain advice (previously duplicated in 3 files with inconsistent entries). |
| `src/lib/format.ts` | Single place for currency/date formatting (INR default, D12) and relative time. |
| `src/lib/orders.ts` | Order helpers: allowed transitions (mirrors SQL), summaries, current total, CSV export with formula-injection protection. |
| `src/lib/validation.ts`, `src/lib/productForm.ts` | Client Zod schemas mirroring the server, friendly Firebase error messages. |
| `src/lib/routes.ts` | `dashboardPath(role)`. |

### Demo mode (`VITE_MOCK=true`)
| File | What / why |
| --- | --- |
| `src/mocks/api.ts` | In-memory + localStorage fake of every endpoint the UI uses (catalogue, orders, status changes, reviews, notifications, listings, stats, image upload). Exports `MOCK_ENABLED` and `resetMockState()`. |
| `src/mocks/data.ts` | 40 products, 10 categories, generated reviews. Images point at `public/mock/products/<id>.jpg`. |
| `src/mocks/session.ts` | The demo buyer and farmer profiles and the remembered role. |
| `src/lib/api.ts` | One early return: when `MOCK_ENABLED`, the request goes to `mockRequest` instead of `fetch`. |
| `src/context/AuthContext.tsx`, `src/pages/Login.tsx` | `demoSignIn(role)` and the two demo buttons. With the flag off, behaviour is unchanged. |
| `src/components/Layout.tsx` | "Reset demo data" link in the footer (only rendered in demo mode). |
| `src/components/ProductCard.tsx`, `src/pages/ProductDetail.tsx`, `src/types/index.ts` | Optional `mrp` field: "% OFF" tag and struck-through list price. No effect when the API sends no `mrp`. |
| `src/components/FeaturedProducts.tsx`, `src/lib/queries.ts` | "Best sellers" rail with `sort: "popular"`, shown in demo mode only (the API does not support that sort). |
| `public/mock/products/*.jpg`, `public/mock/CREDITS.md` | Demo photos (Wikipedia lead images, free licences) and their credits. |
| `.env.example` | `VITE_MOCK=false`. |

### Pages
| Page | What changed / why |
| --- | --- |
| `Login.tsx` | Real Firebase sign-in/sign-up with inline validation, password reset, safe post-login redirect. Removed the leftover "for demo: any password works" copy and the confusing role picker on the login tab. |
| `CompleteProfile.tsx` (new) | One-time onboarding for accounts that predate the `Profile` table. |
| `Profile.tsx` | Now an editable form (it was a read-only page that redirected away). Role and email are read-only. |
| `Products.tsx` | Filters were decorative; now Category, Production type and Price range really filter, server-side, with sort and pagination. The **URL is the source of truth** (shareable/back-button safe). Search no longer reloads the page. |
| `ProductDetail.tsx` | Live data, stock-aware quantity stepper, seller and "more from this seller" link, **reviews section**, owner/farmer messaging. Replaced three unsubstantiated icons ("Easy Returns", …) with real facts. |
| `Categories.tsx`, `CategoryDetail.tsx` | Shared query hooks; real product counts; error states. |
| `Cart.tsx` | Live prices/stock, stock conflict warnings, **per-farmer shipping**, delivery address, **cash on delivery** notice, server error messages (e.g. "Not enough stock"). |
| `Orders.tsx` | Was hard-coded sample data repeated in four tables. Now one real table with search, status filter, tabs and CSV export. |
| `OrderDetail.tsx` (new) | The "View Details" button previously led to a route that didn't exist. Shows items, delivery address, payment status, and the correct per-role actions (Accept / Ship / Deliver / Cancel / Review). |
| `FarmerDashboard.tsx` | Was 800+ lines of mock data and mock charts, with hooks called conditionally. Now real stats (listings, restock, open items, delivered revenue), inventory with edit/stock/delete, recent orders, 6-month sales chart from real orders, terrain suggestions. Mobile-friendly tables. |
| `BuyerDashboard.tsx` | Removed invented stats ("+2 this month"), a fake "AgriLink Pro" upsell, a fake help toast and mock analytics. Real totals and recent orders. |
| `MyReviews.tsx` | Was mock data; now your real reviews with delete. |
| `Contact.tsx` | Posts to the API; details come from env; truthful FAQ; hard-coded map removed. |
| `About.tsx`, `Index.tsx` | Honest copy; testimonials section removed. |
| `Privacy.tsx`, `Terms.tsx` (new) | See section 9. |

### Components
| Component | What / why |
| --- | --- |
| `Layout.tsx` | Account menu (dashboard, orders, reviews, profile, sign out), notification bell, working client-side search, correct tablet breakpoint, accessible labels, footer without a fake newsletter form (it showed "Subscribed!" but stored nothing). |
| `ProductCard.tsx` | Unit shown (`/ kg`), seller, rating, sold-out state, image fallback; farmers see "View details" instead of Add to Cart. |
| `ProductFormDialog.tsx` | Replaces `document.getElementById` form scraping; validated with react-hook-form + Zod; category, unit and production type are real choices (they were hard-coded to `kg`/`Traditional`); **photo upload**. |
| `ProductReviews.tsx`, `Stars.tsx` | Review list, summary, form (only for eligible buyers), accessible star input. |
| `NotificationBell.tsx` | Unread badge, list, mark read / all read, polls every 60 s. |
| `ProfileFields.tsx` | Shared form fields for sign-up, onboarding, profile edit. |
| `StatusBadge.tsx`, `ProductionBadge.tsx` | One definition of the status/production-type look. |
| `CategorySection.tsx` | Icons for Eggs and Oils (they rendered a grey dot because names didn't match), real counts. |
| `FeaturedProducts.tsx` | Newest in-stock products; hides itself if empty rather than leaving a dangling heading. |
| `WhyChooseUs.tsx`, `CallToAction.tsx` | Claims rewritten to match real features. |
| `LegalPage.tsx` | Shared legal page layout. |
| `ui/checkbox.tsx`, `ui/textarea.tsx`, `ui/command.tsx` | Checkbox corner radius (the theme's large radius made it look like a radio button); two lint fixes (`interface {}` → `type`). |

### Design notes
Visual language is unchanged (green palette, shadcn components, same spacing). Additions follow it:
branded leaf placeholder (`public/placeholder.svg`), favicon (`public/favicon.svg`), consistent empty/error states,
status colours, mobile tables that hide secondary columns, 2-column stat cards on phones.

---

## 8. Tooling, config, dependencies, repo hygiene

| Change | Why |
| --- | --- |
| `tsconfig.app.json`, `tsconfig.json`: `strict: true`, removed `strictNullChecks: false` etc. | D14. |
| `eslint`: errors 30 → 0 (conditional hooks, `any`, `require`, empty interfaces). Remaining 10 warnings are shadcn "fast refresh" notices. | Real bugs hid behind lint errors, e.g. hooks called after an early `return`. |
| `vite.config.ts` | Proxy target configurable (`API_URL`), default `:5001`; removed `lovable-tagger`. |
| `vercel.json` | Security headers + CSP (frame-src none, connect-src limited to Firebase endpoints). |
| `index.html` | Real title/description/OG tags; favicon; removed the third-party `gptengineer.js` script. |
| `public/robots.txt` | Disallows `/api/` and private pages. |
| `package.json` | Name `agrilink`; removed unused `@supabase/supabase-js` and `lovable-tagger`; added `typecheck`, `test` scripts; `dev:all` names its processes. React Router 7 (security advisory) and Firebase 12 (only `firebase/app` and `firebase/auth` are used, so the upgrade is source-compatible). |
| `backend/package.json` | Added `jose`, `zod`, `helmet`, `express-rate-limit`; dev: `@electric-sql/pglite`; `npm test`. |
| Lockfiles | Deleted `bun.lockb` and `yarn.lock` (kept `package-lock.json`). Three lockfiles drift apart and install different versions. |
| `.env.example`, `backend/.env.example` | Documents every variable; nothing secret committed. |
| `README.md` | Rewritten to match how the project really works. |
| `CHANGES.md` | This file. |

---

## 9. Content and legal

| Change | Why |
| --- | --- |
| Testimonials component deleted | Fabricated quotes with stock photos and invented names presented as real users. |
| "Join thousands of satisfied customers" removed | Unsubstantiated. |
| About: invented "founded in 2023 by agricultural experts" replaced with a true statement (began as a university project) | Do not publish a made-up company history. |
| Contact: placeholder phone numbers, invented office address and a hard-coded Bengaluru map removed; details come from env | Never show contact details that don't exist. |
| FAQ rewritten | Previously promised "strict quality control" and "market intelligence tools" that don't exist. |
| Footer: fake newsletter, "Coming soon" toasts for Shipping/Returns removed | Fake success messages and dead links. |
| `Privacy.tsx`, `Terms.tsx` | Describe real data handling (Firebase, Supabase, Vercel; no ads/tracking; cart in localStorage), cash-on-delivery, per-farmer shipping, cancellation and review rules. Needs lawyer review before public launch. |

---

## 10. Tests and how to run them

```bash
npm test --prefix backend      # 53 tests: API, fuzzing, token verification, SQL on a real Postgres engine (npm ci is clean on both packages)
npm run typecheck              # strict TypeScript
npm run lint                   # 0 errors
```

| File | Covers |
| --- | --- |
| `backend/test/api.test.js` | Authentication, roles, ownership, validation, response shaping, rate limits, error masking, reviews, notifications, uploads (magic bytes, size, naming), contact honeypot, COD/shipping presentation. |
| `backend/test/firebaseVerifier.test.js` | Valid token accepted; wrong audience/issuer/signature, expired, no subject and unsigned (`alg: none`) rejected. |
| `backend/test/sql.test.js` | Real Postgres (PGlite): v1 → latest upgrade with data, idempotency, order atomicity and rollback, per-farmer shipping, status machine, restock-once, notifications, review rules (delivered-only, one per purchase, aggregate updates). |
| `backend/test/fuzz.test.js` | Robustness sweep: hostile/malformed input must never yield a 5xx or leak internals (section 14). |
| `backend/test/fakeSupabase.js` | In-memory stand-in for supabase-js used by the API tests (not a Postgres emulator; SQL is tested separately). |
| `backend/test/fixtures/schema_v1.sql` | The original schema, used to prove the upgrade path. |

Additionally, browser-level end-to-end runs (real frontend + real API + in-memory DB, with Firebase aliased to a
local stand-in) were used during development to verify: browsing and filters, route guards, sign-up/sign-in/onboarding,
multi-farmer checkout, per-farmer shipping, fulfilment by role, cancellation + restock, reviews, notifications,
image upload (including a disguised non-image), contact form, legal pages, CSP with no violations, and graceful
degradation when the API returns HTML. Those scripts are not committed because they depend on a local harness.

---

## 11. Deleted files

| File | Reason |
| --- | --- |
| `app.txt` | Stray copy of an old `Login.tsx`. |
| `src/firebaseConfig.ts` | Replaced by `src/lib/firebase.ts` (no Firestore, graceful when unconfigured). |
| `src/lib/supabaseClient.ts` | Hard-coded public key; browser no longer uses Supabase. |
| `src/lib/categoryService.ts`, `src/services/categoryService.ts`, `src/types/categoryService.ts` | Three identical copies of one function, none used. |
| `src/services/mockData.ts` | Mock products/reviews/users that leaked into real flows. |
| `src/components/AnalyticsQueries.tsx` | Fake "SQL analytics" results; replaced by real dashboard stats. |
| `src/components/TerrainInformation.tsx` | Unused; duplicated terrain data with inconsistent entries. |
| `src/components/Testimonials.tsx` | Fabricated testimonials (section 9). |
| `src/App.css` | Vite template leftovers that centred `#root`. Unused. |
| `test-api.js`, `test-checkout.js`, `testSupabase.js` | Ad-hoc scripts that wrote to the live database without auth; superseded by `backend/test/`. |
| `bun.lockb`, `yarn.lock` | Duplicate lockfiles. |
| (`src/pages/MyReviews.tsx` was rewritten, not removed.) | |

Anything deleted is still in git history.

---

## 12. Known limitations

Be explicit about these when planning next work:

1. **Real online payments** are not integrated (COD only). Adding a gateway means a webhook endpoint, an `Order.paymentStatus` column and refund handling.
2. **Email/SMS notifications** are not sent; only in-app. Add a sender that reads the `Notification` table.
3. **Rate limits are in memory** and per serverless instance, so they slow abuse but are not a global cap. Use a shared store (e.g. Upstash Redis) for strict limits.
4. **Revoked Firebase sessions** remain valid for up to an hour (tokens are verified statelessly).
5. **Image uploads** pass through the API (limit 3 MB; Vercel's body limit is 4.5 MB). Larger files would need direct-to-storage uploads.
6. **Single flat shipping fee** per farmer, not distance/weight based.
7. **No admin area** (moderating reviews/messages is done in the Supabase dashboard).
8. **Order totals after cancellation** are recomputed for display; the originally charged total is stored on the order.
9. **Resources page** (government schemes) is static content; links should be re-checked periodically.
10. **`npm audit` still reports 9 high findings in the frontend, none of which reach users.** Five (`braces`, `chokidar`, `fast-glob`, `micromatch`, `tailwindcss`) are Tailwind's build-time file-globbing libraries; they run only on a developer/CI machine. Three (`@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js`) and `firebase` itself are flagged by an advisory whose version range covers every Firebase release (its suggested "fix" is a *downgrade* to v9). Firestore and gRPC code is **not** in the production bundle (verified: only the package-name strings appear). Backend production dependencies report 0 vulnerabilities; the backend's 3 findings are the dev-only `nodemon` file watcher. Re-run `npm audit` periodically.
11. **Not tested against live services:** Firebase, Supabase and Vercel were not available while building. The code paths were verified with stand-ins and a real Postgres engine; do a smoke test after the first deploy.

---

## 13. Complete file index

Legend: **A** added, **M** modified, **D** deleted.

### Backend
| | File |
| --- | --- |
| A | `backend/.env.example`, `backend/app.js`, `backend/config.js` |
| M | `backend/index.js`, `backend/supabaseClient.js`, `backend/package.json`, `backend/package-lock.json`, `backend/schema.sql` |
| A | `backend/lib/errors.js`, `backend/lib/schemas.js`, `backend/lib/firebaseVerifier.js` |
| A | `backend/middleware/auth.js` |
| M | `backend/routes/categories.js`, `backend/routes/products.js`, `backend/routes/orders.js` |
| A | `backend/routes/profile.js`, `backend/routes/contact.js`, `backend/routes/reviews.js`, `backend/routes/notifications.js`, `backend/routes/uploads.js` |
| A | `backend/test/api.test.js`, `backend/test/firebaseVerifier.test.js`, `backend/test/sql.test.js`, `backend/test/fakeSupabase.js`, `backend/test/fixtures/schema_v1.sql` |

### Frontend: new
`src/mocks/api.ts`, `src/mocks/data.ts`, `src/mocks/session.ts`, `public/mock/products/*.jpg`, `public/mock/CREDITS.md` (demo mode, see section 7)

`src/lib/api.ts`, `src/lib/firebase.ts`, `src/lib/format.ts`, `src/lib/orders.ts`, `src/lib/productForm.ts`,
`src/lib/queries.ts`, `src/lib/routes.ts`, `src/lib/validation.ts`, `src/data/catalog.ts`, `src/data/terrain.ts`,
`src/components/ErrorBoundary.tsx`, `LegalPage.tsx`, `NotificationBell.tsx`, `PageState.tsx`, `ProductFormDialog.tsx`,
`ProductReviews.tsx`, `ProductionBadge.tsx`, `ProfileFields.tsx`, `RequireAuth.tsx`, `Stars.tsx`, `StatusBadge.tsx`,
`src/pages/CompleteProfile.tsx`, `OrderDetail.tsx`, `Privacy.tsx`, `Terms.tsx`, `public/favicon.svg`

### Frontend: modified
`src/App.tsx`, `src/types/index.ts`, `src/context/AuthContext.tsx`, `src/context/CartContext.tsx`,
`src/components/CallToAction.tsx`, `CategorySection.tsx`, `FeaturedProducts.tsx`, `Layout.tsx`, `ProductCard.tsx`,
`WhyChooseUs.tsx`, `ui/checkbox.tsx`, `ui/command.tsx`, `ui/textarea.tsx`,
`src/pages/About.tsx`, `BuyerDashboard.tsx`, `Cart.tsx`, `Categories.tsx`, `CategoryDetail.tsx`, `Contact.tsx`,
`FarmerDashboard.tsx`, `Index.tsx`, `Login.tsx`, `MyReviews.tsx`, `Orders.tsx`, `ProductDetail.tsx`, `Products.tsx`, `Profile.tsx`,
`public/placeholder.svg`, `public/robots.txt`

### Root / config
| | File |
| --- | --- |
| A | `.env.example` (includes `VITE_MOCK`), `CHANGES.md` |
| M | `README.md`, `index.html`, `package.json`, `package-lock.json`, `tailwind.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `vercel.json`, `vite.config.ts` |
| D | `app.txt`, `bun.lockb`, `yarn.lock`, `test-api.js`, `test-checkout.js`, `testSupabase.js` |

### Frontend: deleted
`src/App.css`, `src/firebaseConfig.ts`, `src/lib/categoryService.ts`, `src/lib/supabaseClient.ts`,
`src/services/categoryService.ts`, `src/services/mockData.ts`, `src/types/categoryService.ts`,
`src/components/AnalyticsQueries.tsx`, `src/components/TerrainInformation.tsx`, `src/components/Testimonials.tsx`


---

## 14. Deep-review pass: defects found afterwards and fixed

After the build-out, the whole system was reviewed adversarially: reasoning about data isolation, concurrency,
scaling limits and state handling; fuzzing every endpoint; scanning for secrets; and running an automated
accessibility audit. Each item below was **reproduced or demonstrated before being fixed**, then re-verified.

### 14.1 Defects fixed

| # | Severity | Defect | Reproduced by | Fix | Why it matters / benefit |
| --- | --- | --- | --- | --- | --- |
| 1 | **High (privacy)** | **Previous user's data shown to the next user on the same browser.** React Query cached `["orders"]`, `["my-products"]`, `["notifications"]` globally, never cleared on sign-out, with a 30 s `staleTime`. | Browser test: buyer A signed out, buyer B signed in without a reload; B's Orders page listed A's order #1. | `AuthContext` cancels and **clears the whole query cache whenever the signed-in uid changes**. | Shared computers (common for farmers/market stalls) can no longer leak orders, addresses or listings between accounts. |
| 2 | **High (data loss)** | **Editing a product silently reset its stock.** The edit form PATCHed *every* field, so changing a name wrote back the stock number from when the dialog opened, undoing orders placed meanwhile and enabling overselling. | Browser test: dialog opened at 49, a buyer bought 5, farmer renamed the product, stock jumped back to 49. | The form now sends **only the fields the farmer changed** (`dirtyFields`); an unchanged form just closes. The dedicated "Stock" action is the way to set absolute stock. | Orders and edits no longer overwrite each other. |
| 3 | Medium (correctness at scale) | **Dashboard numbers and the Orders page were computed from only the first 100 orders.** Revenue, open items, "total orders", "total spent" and the monthly chart became wrong beyond 100 orders; the Orders page silently stopped at 100. | Code analysis, then browser test with 102 orders. | New SQL aggregate **`order_stats`** + `GET /api/orders/stats`; dashboards read it. The Orders page loads **all pages** (100 per request, up to 1000). | Figures stay correct as the marketplace grows; no silent truncation. |
| 4 | Medium (correctness at scale) | **Category counts and "eligible to review" were computed in Node from rows pulled through PostgREST, which silently caps responses at 1000 rows**, and the review lookup built a giant `IN (...)` URL. | Code analysis (PostgREST default limit; URL-length risk). | SQL functions **`category_counts`** and **`eligible_review_items`**. | Correct and fast regardless of table size. |
| 5 | Medium | **Cart `addItem` returned its result from inside a `setState` updater.** React may run updaters late, so "how many were added?" could be `0` and show a false "Maximum reached". Also, a cart with more than 50 lines made every cart load fail (the API accepts at most 50 ids). | Code analysis; the 50-line failure reproduced in the browser. | Cart state is mutated through a **ref-backed commit** and returns an explicit `{added, reason}`; carts are **capped at 50 products** with a clear "Your cart is full" message; stored carts are de-duplicated and cut to 50. | Predictable cart behaviour; the cart can never become unloadable. |
| 6 | Medium | **Authenticated API responses were cacheable** (no `Cache-Control`). | Code analysis. | `Cache-Control: no-store` on everything under `/api`; only the public category list opts in to caching. | Private data (orders, profile, notifications) is never stored by a browser/CDN. |
| 7 | Medium | **Auth outage looked like "your session expired".** Any verification error, including Google's key endpoint timing out, produced a 401 and logged the user out. | Code analysis; unit test. | Bad tokens → 401; **infrastructure failures → 503 `auth_unavailable`** so the client can retry. The error handler now keeps curated 5xx messages instead of flattening them to a generic 500 (this bug was caught by the new test). | Brief provider hiccups no longer sign people out. |
| 8 | Medium (race) | **Rating aggregate could go stale.** Two simultaneous reviews of one product could each compute the average without seeing the other's uncommitted row. | Concurrency analysis of `submit_review` / `delete_review`. | Both now take a **row lock on the product** first, so reviews of a product are serialised and the recomputed aggregate always includes every committed review. | `Product.rating` / `reviews` stay exact. |
| 9 | Low | **Concurrent duplicate review** hit the `UNIQUE("orderItemId")` constraint and returned a 500. | Code analysis; unit test. | Unique violation (`23505`) → friendly **409**. | Correct status and message under races. |
| 10 | Low | **Unbounded photo storage.** Rate limits slow a farmer but don't bound total uploads. | Code analysis. | Per-farmer cap of **200 photos** (`409 quota`). | Prevents storage abuse. |
| 11 | Low | **Server did not start under `NODE_ENV=production` outside Vercel** (listen was skipped whenever `NODE_ENV=production`). | Code analysis; now a real child-process test. | Listen unless `process.env.VERCEL` is set. | `npm start` works on a VM/container. |
| 12 | Low | **Login hung silently if the account couldn't be loaded** after a successful Firebase sign-in (API down). | Browser test with an injected 500. | The login page explains the problem and offers **Try again**. | No more "nothing happens". |
| 13 | Low | **Anchor links didn't scroll** (`/product/1#reviews`, `/contact#faq`): scroll-to-top ignored hashes, so the "Review" button on a delivered order landed at the top. | Browser test. | `ScrollToTop` looks for the hash target (for ~2 s while data loads) and scrolls to it; plain navigation still starts at the top. | Links do what they say. |
| 14 | Low | Buyers could store a farmer-only `terrain` via profile update. | Code analysis; unit test. | Server strips `terrain` for non-farmers. | Data consistency. |

### 14.2 Accessibility fixes (axe-core audit, WCAG 2.1 A/AA + best practice)

Initial audit: colour-contrast failures on every page, plus several structural errors. After the fixes every audited
page is clean (the only residual output is Radix's intentional `aria-hidden` on the page root while a menu is open).

| Finding | Fix | Benefit |
| --- | --- | --- |
| Muted text `#757c6e` was **4.0:1** on light backgrounds (< 4.5:1) on every page. | `--muted-foreground` darkened to `#666c60` (≥ 4.76:1 on every surface). | Readable for low-vision users; passes WCAG AA. |
| `--accent` hover colour was near-white text on bright lime (**≈ 1.8:1**): every ghost/outline button was unreadable on hover (axe can't see hover; found by computing contrast). | `--accent` is now a subtle green tint with dark text. | Hover states are legible. |
| `text-green-600` stock text (3.3:1), `text-amber-600`, white-on-`red-500` badge (3.8:1), `text-gray-400`/`white/80` on dark green (3.4-3.8:1), primary-green text on its own 10% tint (4.4:1). | `green-700`, `amber-700`, `red-600`, `gray-300`, solid white, `agrilink-dark`. | All text meets AA. |
| **Critical:** Orders filter used Radix *Tabs* with no panels, so `aria-controls` pointed at nothing. | Replaced by an accessible toggle group (`aria-pressed`). | Valid ARIA; correct semantics for a filter. |
| **Critical:** photo `<input type=file>` had no label. | `aria-label` added. | Screen readers announce it. |
| Notification popover (a dialog) had no accessible name. | `aria-label="Notifications"`. | Announced correctly. |
| Pages without an `<h1>` (login, profile, onboarding); card titles and product names skipping heading levels; footer headings under `h1`; 404 page had no `<main>`. | `sr-only` h1s; `CardTitle` is now `h2`; `ProductCard` takes a `headingLevel`; footer headings `h2`; 404 uses the standard layout. | Valid document outline and landmarks for assistive tech. |

### 14.3 Other checks that found nothing wrong
- **Secrets scan:** no keys/tokens/private keys in the working tree, no tracked `.env` files, `.env` and `backend/.env` are git-ignored, and the old leaked Supabase project ref no longer appears anywhere.
- **Fuzzing (`backend/test/fuzz.test.js`):** thousands of malformed bodies, hostile ids, odd query strings, invalid JSON, odd content types, oversized payloads and prototype-pollution attempts, across every endpoint and every role: **no 5xx, no leaked internals, no pollution.**
- **Lock-order analysis:** `place_order` (Product rows in id order), cancel (item then product) and review functions (product row) cannot form a lock cycle, so no deadlocks.
- **Production build + CSP:** no violations; the app degrades gracefully if the API returns HTML.

### 14.4 New and changed files in this pass
| | File | Purpose |
| --- | --- | --- |
| M | `backend/schema.sql` | `category_counts`, `eligible_review_items`, `order_stats`; product row locks in review functions; grants/revokes. |
| M | `backend/app.js`, `backend/index.js`, `backend/middleware/auth.js`, `backend/lib/firebaseVerifier.js` | `no-store`, 5xx handling, 401-vs-503, listen rule, proper jose error for missing subject. |
| M | `backend/routes/categories.js`, `reviews.js`, `orders.js`, `profile.js`, `uploads.js` | SQL aggregates, `/orders/stats`, 409 mapping, terrain rule, upload quota. |
| A | `backend/test/fuzz.test.js` | Robustness sweep. |
| M | `backend/test/api.test.js`, `sql.test.js`, `fakeSupabase.js` | Regression tests for every fix above (53 backend tests total). |
| M | `src/context/AuthContext.tsx`, `CartContext.tsx` | Cache clear on identity change; ref-backed cart with 50-line cap. |
| M | `src/lib/queries.ts` | `useOrders` loads all pages; `useRecentOrders`, `useOrderStats`. |
| M | `src/components/ProductFormDialog.tsx`, `ProductCard.tsx`, `NotificationBell.tsx`, `Layout.tsx`, `ProductReviews.tsx`, `CallToAction.tsx`, `CategorySection.tsx`, `ProfileFields.tsx` | Dirty-only PATCH; heading level; contrast and labels. |
| M | `src/pages/FarmerDashboard.tsx`, `BuyerDashboard.tsx`, `Orders.tsx`, `Login.tsx`, `Profile.tsx`, `CompleteProfile.tsx`, `NotFound.tsx`, `Products.tsx`, `CategoryDetail.tsx`, `ProductDetail.tsx`, `Resources.tsx` | SQL stats; toggle group; headings; error state; layout. |
| M | `src/App.tsx` | Hash-aware scroll restoration. |
| M | `src/index.css`, `src/components/ui/card.tsx` | Accessible colour tokens; `CardTitle` is an `h2`. |

### 14.5 Remaining known limitations (found, deliberately not changed)
- **Uploaded photos are not deleted** when a product is removed or its photo replaced (they only count toward the 200 cap). Add a cleanup job or delete-on-replace if storage cost matters.
- **Order responses include the buyer's Firebase UID to the farmer** (not secret and not a credential; hiding it would need a `viewerIsBuyer` flag).
- **Stock edits via the "Stock" dialog are absolute** by design ("I physically have N"): they can still race with a simultaneous order. Use it for restocking, not while orders are arriving rapidly.
- **Notifications are never pruned**; add a retention job if volume grows.
- Orders page loads up to 1000 orders client-side; very large accounts would need server-side filtering/pagination.
