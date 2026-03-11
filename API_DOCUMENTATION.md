# API Documentation

Base URL while running locally: `http://localhost:3000/api` (all paths below are relative to `/api`). Auth uses a JWT in the `auth_token` httpOnly cookie issued by register/login/workspace endpoints; no middleware currently enforces it, so clients should still send the cookie or `Authorization: Bearer <token>` when you add auth later.

## Health & Diagnostics

- **GET `/health`** — Heartbeat plus database reachability. Returns `{ status: 'OK', message, dbStatus: 'connected' | 'failed' | 'disconnected', timestamp }`.
- **GET `/test-db`** — Lightweight MongoDB connectivity check. Success: `{ ok: true }`; failure: `{ ok: false, error }` with `500`.

## Reference Data

- **GET `/reference-data?country=India`** — Returns static dropdown data used during onboarding: `industries`, `countries`, `states` (by `country` query, defaults to India), `languages`, `timeZones`, `currencies`. No auth.

## Auth & Password Reset

- **GET `/auth`** — Stubbed auth check using `requireAuth`; responds `{ authenticated: boolean }`.
- **POST `/auth/register`** — Creates a user and a fresh workspace in one step; issues JWT + cookie. Required body: `name` (or `fullName`), `email`, `password` (>= 8 chars), `companyName`, `companyAddress`. Optional: `phoneNumber`, `isIndiaB2B` (if true, `gstNumber` required), `role` (admin|manager|viewer, defaults to admin for creator). Returns `201` with `{ user, token, workspace { ... , joinCode } }` and sets `auth_token` cookie for 7 days. 409 if email exists.
- **POST `/auth/login`** — Email/password login; issues JWT + cookie. Body: `email`, `password`. Success: `{ user, token }` with cookie. Errors: `400` missing fields, `401` invalid, `500` on failure.
- **POST `/auth/logout`** — Clears `auth_token` cookie and returns `{ message: 'logged out' }`.
- **POST `/auth/forgot`** — Generates 15‑minute reset token and emails link `${APP_URL}/reset-password?token=...` when a user exists. Body: `email`. Always returns `{ message: 'If an account exists, a reset email has been sent.' }` to avoid enumeration.
- **POST `/auth/reset`** — Validates reset token and sets new password. Body: `token`, `password` (>= 8). Success: `{ message: 'Password updated successfully' }`; errors: `400` invalid/expired, `500` failure.

## Workspaces

- **POST `/workspaces`** — Create a workspace and mark `ownerUserId` as creator/admin. Body: `name`, `ownerUserId` (must exist). Returns `201` with `{ workspace, joinCode, token }`, sets `auth_token` cookie, and updates owner’s `workspaceId/isCreator/role`.
- **POST `/workspaces/join`** — Join via `joinCode`. Body: `joinCode`, plus either `userId` (existing) or `email` (creates lightweight user if not found). Optional: `name`, `role` (admin|manager|viewer; defaults viewer). Returns `{ workspace, user, token }` and sets cookie; increments workspace member count.
- **PATCH `/workspaces/:workspaceId`** — Regenerate join code. Body: `requesterUserId` (must be workspace creator/owner). Returns `{ workspace, joinCode }`; 403 if requester is not the owner.

## Users

- **GET `/users`** — Lists users newest first. Returns `{ users }` with password/reset fields omitted.
- **POST `/users`** — Create a user record (no login password). Required: `name`, `email`. Optional: `role` (admin|manager|viewer, default viewer), `phoneNumber`, `companyName`, `isIndiaB2B`, `gstNumber`, `companyAddress`. Returns `201` `{ user }`; 409 if email exists.
- **GET `/users/:id`** — Fetch one user by Mongo `_id`. Returns `{ user }` without password/reset fields; `404` if missing.

## Purchase Orders

- **GET `/purchase-orders`** — List purchase orders. Optional query: `workspaceId`, `approverUserId` (alias `approverUserId`). Returns `{ success: true, data: orders }`.
- **POST `/purchase-orders`** — Create a purchase order. Required body: `orderNumber` (or `poNumber`), `supplier`, `orderDate`, `currency`, `items` array (each needs `name`, `qty`, `rate`; optional `tax`). Optional: `deliveryAddress`, `notes`, `workspaceId`, `shipping`, `discount`, `approverUserId`, `createdByUserId`. Server computes `subtotal`, `taxTotal`, `total`, and sets `status: 'pending'`. Success `201` with `{ success: true, data }`; `400` on validation errors.
- **GET `/purchase-orders/approvals?userId=...&status=pending`** — Lists purchase orders assigned to an approver, filtered by `status` (defaults `pending`). Returns `{ success: true, data: orders }` with limited fields.

## Bot

- **POST `/bot`** — Sends `{ message }` to the placeholder bot service and echoes back `{ reply, timestamp }`. Currently a stub; replace `chatWithBot` to integrate a real LLM.

## Common Notes

- **Status codes**: Standard `200/201` on success, `400` for validation errors, `401/403` for auth/permission checks (where implemented), `404` for missing resources, `409` for duplicates, `500` for server errors.
- **Data models**: Purchase orders ensure unique `orderNumber`; users enforce unique `email`; workspaces have unique `workspaceId` and `joinCode`. Amount fields (`subtotal`, `taxTotal`, `total`) are computed server-side from items, `shipping`, and `discount`.
- **Environment**: Set `JWT_SECRET` in production; `APP_URL` controls the reset link host. MongoDB connection string is read from `MONGODB_URI`.
