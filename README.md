# Meta — WhatsApp Cloud API Platform

A multi-tenant WhatsApp Cloud API (Meta) wrapper. Tenants sign up with an email or phone number, get a scoped API key, and send customer messages (OTPs, promos, media, interactive) through a single HTTP API — **they never touch Meta directly**.

The platform also handles **inbound** WhatsApp messages: it verifies Meta webhooks and forwards each message to the tenant's AI agent (`agent_webhook_url`), then sends the agent's reply back through the same connected number.

![Stack](https://img.shields.io/badge/stack-Express%205+TypeScript+Postgres+Drizzle-teal) ![UI](https://img.shields.io/badge/dashboard-React+19+Vite+Tailwind%20v4-coral)

## Repository layout

```
.
├── src/
│   ├── config/            # env parsing (zod), logger (pino)
│   ├── common/            # middleware (auth, validate, errors), crypto, jwt, password
│   ├── db/                # Drizzle schema, migrations (pnpm db:push), seed script
│   ├── modules/
│   │   ├── messages/      # POST /api/v1/messages/* — send text/template/media/interactive/...
│   │   ├── templates/     # template meta management
│   │   ├── media/         # media upload/download
│   │   ├── contacts/      # contact existence + import (source: Meta contacts API)
│   │   ├── webhooks/      # Meta webhook verify + receive, agent routing
│   │   ├── clients/       # client dashboard: signup/login (JWT), API keys, analytics
│   │   └── health/        # /health
│   └── server.ts
├── client/                # Client dashboard SPA (React 19 + Vite + Tailwind v4 + Radix)
├── docker-compose.yml     # local Postgres
└── .env.example
```

## Prerequisites

- Node.js ≥ 22
- Docker (for local Postgres)
- Meta for Developers app + verified WABA/Phone Number (only needed for real traffic; the platform runs without it)

## Quick start

```bash
# 1. Database
docker compose up -d          # Postgres on localhost:5432 (meta/meta/meta_api)

# 2. Environment
cp .env.example .env
npm i
npm run keygen                # prints a key → paste into ENCRYPTION_KEY in .env
npm run db:push               # apply schema
# optional: connect your real Meta number once (stores encrypted tokens in wa_accounts)
npm run db:seed               # requires META_ACCESS_TOKEN / META_PHONE_NUMBER_ID / META_WABA_ID

# 3. Run the platform
npm run dev                   # http://localhost:3000 (use PORT=3456 to avoid port conflicts)
```

### Client dashboard

```bash
cd client
npm i
npm run dev                   # http://localhost:5173 — proxies /api → http://localhost:3456
```

> When running the client dev server, run the platform on the port configured in `client/vite.config.ts` (default `3456`):
> `PORT=3456 npm run dev`

### Dev test account

After `npm run db:push` you can sign up in the browser, or use the seeded demo account (created during development, has sample analytics):

```
Email:    acme@test.com
Password: super-secret-1
```

## Environment variables (`src/config/env.ts`)

| Variable                | Required | Purpose |
|-------------------------|----------|---------|
| `DATABASE_URL`          | yes      | Postgres connection string |
| `ENCRYPTION_KEY`        | yes      | 64-hex AES-256-GCM key; encrypts stored Meta tokens. Generate with `npm run keygen` |
| `JWT_SECRET`            | yes      | Signs dashboard session JWTs |
| `JWT_EXPIRES_IN`        | no       | Session lifetime (default `7d`) |
| `PORT`                  | no       | HTTP port (default `3000`) |
| `RATE_LIMIT_WINDOW_MS`  | no       | Rate-limit window (default `900000`) |
| `RATE_LIMIT_MAX`        | no       | Max requests / window / IP (default `1000`) |
| `META_GRAPH_VERSION`    | no       | Meta Graph API version (default `v26.0`) |
| `META_ACCESS_TOKEN`     | seed only | Meta access token — used once by `npm run db:seed` |
| `META_PHONE_NUMBER_ID`  | seed only | Platform WhatsApp number to connect |
| `META_WABA_ID`          | seed only | WhatsApp Business Account id |
| `META_APP_ID`           | no       | Enables embedded signup `/connect-whatsapp` (not yet implemented) |
| `META_APP_SECRET`       | no       | Verifies webhook signature (recommended in production) |
| `META_VERIFY_TOKEN`     | yes      | Webhook verification token you configure in the Meta dashboard |
| `AGENT_TIMEOUT_MS`      | no       | Agent reply timeout (default `10000`) |

## Authentication model

Two independent auth layers:

1. **Messaging API** — requests from your servers. Send `X-API-Key: mwa_live_...` (key is stored as a SHA-256 hash).
2. **Client dashboard** — browser sessions. `POST /api/v1/auth/signup` or `/login` returns a JWT used as `Authorization: Bearer <token>`.

> Signup auto-creates a tenant + client user + **one default API key** (shown once; stored hashed). Duplicate email/phone → `409`.
> API keys are managed in the dashboard at `/api/v1/clients/me/api-keys` (create + revoke).

## API reference

All responses: `{ success: boolean, data?, error?, message? }`.

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + DB check |
| GET | `/api/v1/webhooks` | Meta webhook verification (`hub.mode` / `hub.verify_token`) |
| POST | `/api/v1/webhooks` | Meta webhook events (signature-verified) |

### Messaging API — `X-API-Key` header

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/messages/text` | Plain text (`{ to, text, previewUrl? }`) |
| POST | `/api/v1/messages/template` | Approved template (`{ to, templateName, language, bodyParameters?, components? }`) |
| POST | `/api/v1/messages/media` | Image/video/audio/document (`link` or `mediaId`) |
| POST | `/api/v1/messages/interactive` | Buttons / list / flows / CTA |
| POST | `/api/v1/messages/location` | Location pin |
| POST | `/api/v1/messages/contacts` | Share a contact |
| POST | `/api/v1/messages/read` | Mark a message as read |
| POST | `/api/v1/webhooks/messages` | List inbound/outbound messages for this tenant |
| POST | `/api/v1/templates` · `/api/v1/media` · `/api/v1/contacts` | Template/media/contact management |

```bash
curl -X POST http://localhost:3000/api/v1/messages/text \
  -H "X-API-Key: mwa_live_..." \
  -H "Content-Type: application/json" \
  -d '{"to":"+15551234567","text":"Your OTP is 123456"}'
```

> Real sends require the platform number to be connected. Without Meta credentials, calls are rejected/dry-run with a clear error.

### Client dashboard API — `Authorization: Bearer <jwt>`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/signup` | `{ email?|phone?, password }` → JWT + first API key |
| POST | `/api/v1/auth/login` | `{ identity, password }` (identity = email or phone) |
| GET | `/api/v1/clients/me` | Profile |
| GET/POST | `/api/v1/clients/me/api-keys` | List / create API key |
| DELETE | `/api/v1/clients/me/api-keys/:id` | Revoke |
| GET | `/api/v1/clients/me/whatsapp` | Connected WhatsApp numbers |
| GET | `/api/v1/clients/me/connect-whatsapp/link` | Connect-another-number start URL |
| GET | `/api/v1/clients/me/analytics/summary?from&to` | Totals, byType/byChannel/byStatus, delivered/read/failed rates |
| GET | `/api/v1/clients/me/analytics/timeseries?granularity=day\|hour` | Message volume over time |
| GET | `/api/v1/clients/me/analytics/top-contacts?limit` | Most active peers |
| GET | `/api/v1/clients/me/messages?page&limit&direction&type&status` | Message history, paginated + filterable |

All scoped to the caller's tenant.

## Webhooks → Agent routing

Flow for tenant messages:

```
Meta ──webhook──▶ POST /api/v1/webhooks  (signature checked, decrypted tokens)
                        │
                        ▼
              inbound message_logs row
                        │
                        ▼
        POST tenant.agent_webhook_url   (x-agent-token header if set)
                        │
                        ▼  reply JSON: { "reply": { "type": "text", "text": "..." } }
              outbound message_logs row ──▶ Meta send API
```

The agent endpoint can reply with either:

- `{ "reply": { "type": "text", "text": "hi" } }` (or `"reply": { "type": "template", ... }`), or
- a plain string body (treated as text reply)

If the agent times out (`AGENT_TIMEOUT_MS`) or errors, the inbound message is logged and no reply is sent.

## Client dashboard (`client/`)

React 19 + Vite 8 + Tailwind v4 + Radix UI + TanStack Query + Zustand + Recharts.

- `features/auth` — signup (with one-time API-key reveal), login
- `features/dashboard` — Overview (stat cards, volume chart, top contacts), Messages, API keys, Settings
- Shared primitives in `src/components`, API client in `src/lib/api.ts` (auto-attaches JWT, logs out on 401), persistent session in `src/stores`
- Design tokens from `client/DESIGN.md` implemented via Tailwind v4 `@theme`

Build: `npm run build` (runs `tsc -b` + `vite build`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Platform dev server (tsx watch) |
| `npm run build` / `start` | Compile TS → `dist/` / run it |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:push` | Apply schema changes to Postgres |
| `npm run db:seed` | Connect the platform Meta number (reads Meta env vars) |
| `npm run keygen` | Generate an AES-256-GCM `ENCRYPTION_KEY` |

## Security

- API keys stored as SHA-256 hashes; never retrievable after creation
- Meta access tokens encrypted at rest with AES-256-GCM (`ENCRYPTION_KEY`)
- Passwords hashed with `scrypt` (random salt + default params)
- Dashboards sessions are short-lived JWTs
- Express security headers (`helmet`), per-IP rate limiting, webhook signature verification (`META_APP_SECRET`)