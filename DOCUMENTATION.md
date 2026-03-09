# Project Documentation (Next.js App Router, JavaScript)

## Overview
- Single Next.js 15 App Router app that serves both UI and APIs. No separate backend or TypeScript.
- MongoDB (via Mongoose) for data; all API routes live under `src/app/api`.

## Folder & File Guide
- `src/app/layout.js` — Root HTML/body wrapper; loads global styles and header.
- `src/app/page.js` — Redirects to /home.
- `src/app/home/page.js` — Landing page with animated hero, CTAs, FAQs, guide, and contact.
- `src/app/signup/page.js` — Signup form UI (client component).
- `src/app/login/page.js` — Login UI (client component).
- `src/app/workspace/page.js` — Post-login menu for key actions (animated background).
- `src/app/bot/page.js` — Bot console UI placeholder.
- `src/app/globals.css` — Global Tailwind/CSS styles and animation keyframes/utilities.

### API routes (`src/app/api`)
- `purchase-orders/route.js` — CRUD endpoints backed by `PurchaseOrder` model.
- `auth/route.js` — Auth check stub (replace with real auth).
- `auth/register/route.js` — Create account (hashes password, prevents duplicate email).
- `auth/login/route.js` — Verify credentials, returns user + JWT, sets httpOnly cookie.
- `auth/logout/route.js` — Clears auth cookie.
- `auth/forgot/route.js` — Generates reset token, emails link (15 min expiry).
- `auth/reset/route.js` — Validates token, updates password.
- `users/route.js` — Users API stub.
- `users/[id]/route.js` — Fetch a single user by id (password fields omitted).
- `bot/route.js` — Bot chat endpoint using `botService`.
- `test-db/route.js` — Quick Mongo connectivity check.

### Components (`src/components`)
- `Header.jsx` — Top navigation (links to Home/Bot).
- `PurchaseOrderForm.js` — Client-side form for creating POs (calls onSubmit prop).
- `PurchaseOrderTable.js` — Displays list of purchase orders.
- `ChatBot.js` — Placeholder chat UI; wire to bot API.
- `ui/` — Reserved for shared UI primitives (currently empty).

### Lib (`src/lib`)
- `mongodb.js` — Mongoose singleton (`connectDB`, strictQuery, bufferCommands off) and optional native driver helper (`getMongoClient`) using Stable API (ServerApiVersion.v1) with safe global caching. Throws in production if `MONGODB_URI` is missing, falls back to local URI in dev with a warning.
- `Breadcrumbs.jsx` — Client breadcrumbs using `usePathname`; hidden on landing.
- `email.js` — Nodemailer helper for SMTP sends.
- `auth.js` — Auth utilities stub.

### Services (`src/services`)
- `purchaseOrderService.js` — Business logic for POs (uses Mongo + model).
- `botService.js` — Bot interaction stub.

### Models (`src/models`)
- `PurchaseOrder.js` — Mongoose schema/model for purchase orders.
- `User.js` — Mongoose schema/model for users.

### Config & meta
- `next.config.mjs` — Next.js config.
- `tailwind.config.mjs` — Tailwind paths/theme.
- `jsconfig.json` — Path aliases (`@/*` → `src/*`).
- `.env.local` — Environment variables (e.g., `MONGODB_URI`).
- `package.json` — Single dependency set for app + APIs.

## How things connect
1) UI pages/components call API routes under `src/app/api/...`.
2) API routes use services/models to read/write Mongo via `lib/mongodb`.
3) Models define the Mongo schemas; services hold business logic.

## Development
- Install: `npm install`
- Dev server: `npm run dev` (serves UI + APIs)
- Build: `npm run build`
- Lint: `npm run lint`

## Extend
- Add new API: create `src/app/api/<feature>/route.js`, use `connectDB()` and a model.
- Add new model: place in `src/models/`, export default Mongoose model.
- Add shared UI: put primitives into `src/components/ui/` and reuse.
