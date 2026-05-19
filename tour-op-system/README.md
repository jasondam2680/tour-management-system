# 🌏 Tour OP System

Enterprise-grade Tour Operator Management System — Phase 1-3

## Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand |
| Backend  | NestJS, TypeScript, Prisma 7, PostgreSQL      |
| Infra    | Docker, Redis, pgAdmin                        |

## Prerequisites

- Node.js >= 20
- npm >= 10
- Docker Desktop (running)

## Quick Start

### 1. Start databases

```bash
docker-compose up -d
# PostgreSQL → localhost:5432
# Redis      → localhost:6379
# pgAdmin    → http://localhost:5050 (admin@tourop.com / admin123)
```

### 2. Install dependencies

```bash
# Root
npm install

# Backend
cd apps/api && npm install

# Frontend
cd apps/web && npm install
```

### 3. Setup database

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
node prisma/seed.js
```

### 4. Start development servers

```bash
# Terminal 1 — Backend (port 3001)
cd apps/api
npm run dev

# Terminal 2 — Frontend (port 3000)
cd apps/web
npm run dev
```

## Access

| Service  | URL                            |
| -------- | ------------------------------ |
| Frontend | http://localhost:3000          |
| API      | http://localhost:3001/api/v1   |
| Swagger  | http://localhost:3001/api/docs |
| pgAdmin  | http://localhost:5050          |

## Demo Accounts

| Role        | Email                  | Password     |
| ----------- | ---------------------- | ------------ |
| Super Admin | admin@demotourop.com   | Admin@123456 |
| Sales       | sales@demotourop.com   | Password@123 |
| OP          | op@demotourop.com      | Password@123 |
| Finance     | finance@demotourop.com | Password@123 |
| Guide       | guide@demotourop.com   | Password@123 |

## API Modules (Phase 1-3)

- `POST   /api/v1/auth/login` — Login
- `GET    /api/v1/auth/me` — Current user
- `GET    /api/v1/customers` — List customers
- `POST   /api/v1/customers` — Create customer
- `GET    /api/v1/suppliers` — List suppliers
- `POST   /api/v1/suppliers` — Create supplier
- `GET    /api/v1/leads/kanban` — Kanban board data
- `POST   /api/v1/leads` — Create lead
- `PATCH  /api/v1/leads/:id/status` — Change lead status
- `POST   /api/v1/leads/:id/activities` — Add activity
- `GET    /api/v1/quotations` — List quotations
- `POST   /api/v1/quotations` — Create quotation (auto-calculates totals)
- `PATCH  /api/v1/quotations/:id/status` — Change quotation status
- `POST   /api/v1/quotations/:id/duplicate` — Duplicate quotation

## Frontend Pages

- `/login` — Login page
- `/dashboard` — Overview
- `/dashboard/customers` — Customer list
- `/dashboard/suppliers` — Supplier list
- `/dashboard/leads` — Kanban pipeline
- `/dashboard/quotations` — Quotation list
- `/dashboard/quotations/new` — Quotation builder with live pricing

## Project Structure

```
tour-op-system/
├── apps/
│   ├── api/              ← NestJS backend
│   │   ├── prisma/       ← Schema, migrations, seed
│   │   └── src/
│   │       ├── modules/  ← auth, customers, suppliers, leads, quotations
│   │       ├── common/   ← guards, decorators, filters, interceptors
│   │       └── prisma/   ← PrismaService
│   └── web/              ← Next.js frontend
│       └── src/
│           ├── app/      ← Pages (App Router)
│           ├── lib/      ← API client, utils
│           ├── store/    ← Zustand auth store
│           └── types/    ← TypeScript types
├── docker-compose.yml
└── package.json
```

## Phase Roadmap

- ✅ Phase 1 — Foundation (Monorepo, Docker, NestJS, Prisma, Auth, RBAC)
- ✅ Phase 2 — Customers + Suppliers + Frontend shell
- ✅ Phase 3 — Leads CRM + Quotation Builder
- ⚠️ Phase 4 — Tours + Bookings + Finance (AR/AP) - 40% complete

## Project Status

For detailed progress tracking, see [PROGRESS.md](PROGRESS.md)

- **Overall Completion**: 65%
- **Phase 1-3**: 100% complete
- **Phase 4**: 40% complete (in progress)

## Codespaces / Devcontainer

This repository includes a `.devcontainer` configuration to run the project in GitHub Codespaces or a local Docker-based development container.

- Start the container locally with Docker Compose (runs a workspace container + Postgres):

```bash
cd .devcontainer
docker compose up -d --build
```

- Inside the container or Codespace the `postCreateCommand` installs dependencies and runs `prisma generate` automatically.

- Required environment variables (set in Codespaces Secrets or `.env` locally):
  - `DATABASE_URL` — Postgres connection string, e.g. for local dev `postgres://dev:dev@localhost:5432/devdb`, or for Codespaces/devcontainer `postgres://dev:dev@db:5432/devdb`
  - `JWT_SECRET` — app JWT signing secret
  - `NEXT_PUBLIC_API_URL` — public API base URL for the web app (optional for local)

- Add secrets for Codespaces: GitHub → Repository → Settings → Secrets and variables → Codespaces secrets. Do NOT commit `.env` files.

- Forwarded ports (configured in the devcontainer): `3000` (API), `3001` (Web), `5432` (Postgres).

- Running apps inside the codespace / container:

```bash
# API
cd apps/api
npm run dev

# Web
cd apps/web
npm run dev
```

- Troubleshooting tips:
  - If Prisma reports missing client, run `npx prisma generate` in `apps/api`.
  - If DB connection fails, ensure `DATABASE_URL` points to the running Postgres container at `db`.
  - Confirm ports are forwarded in Codespaces if you can't reach the apps from the browser.
