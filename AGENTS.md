# AGENTS.md — Tour OP System

## Repo Layout

- All work happens inside `tour-op-system/` (the repo root only contains `.git/` and this dir)
- npm workspaces monorepo: `apps/api` (NestJS 10) + `apps/web` (Next.js 15)
- Task runner: Turbo v2 (`turbo.json` at root)

## Developer Commands

```bash
# From tour-op-system/ root
npm install                  # installs all workspace deps
npm run dev                  # turbo: starts both api + web
npm run build                # turbo: builds both apps
npm run lint                 # turbo: lint both apps

npm run db:generate          # prisma generate
npm run db:migrate           # prisma migrate dev
npm run db:seed              # node prisma/seed.js
npm run db:studio            # prisma studio

npm run docker:up            # docker-compose up -d
npm run docker:down          # docker-compose down
```

### Per-app dev (when turbo is not suitable)

```bash
cd apps/api && npm run dev   # NestJS on port 3001
cd apps/web && npm run dev   # Next.js on port 3000
```

### Full first-time setup order

```bash
docker-compose up -d                              # PostgreSQL + Redis + pgAdmin
npm install                                       # root workspace install
cd apps/api && npx prisma generate                # generate Prisma client
npx prisma migrate dev --name init                # apply migrations
node prisma/seed.js                               # seed demo data
```

## Architecture

### Backend (`apps/api/`)

- NestJS 10, TypeScript (`module: nodenext`), Prisma 7 with `@prisma/adapter-pg`
- Entry: `src/main.ts` — listens on port 3001
- Modules: `auth`, `customers`, `suppliers`, `leads`, `quotations`, `bookings`, `tours`, `finance`
- Common: `guards/`, `decorators/`, `filters/`, `interceptors/`
- Prisma schema: `prisma/schema.prisma` (777 lines, multi-tenant via `Organization`)
- Swagger at `http://localhost:3001/api/docs`
- Auth: JWT access + refresh tokens, `@Public()` decorator for open routes
- RBAC roles: `SUPER_ADMIN`, `ADMIN`, `SALES`, `OP`, `FINANCE`, `GUIDE`

### Frontend (`apps/web/`)

- Next.js 15 App Router, TypeScript (`strict: false`), Tailwind CSS 3
- Path alias: `@/*` → `./src/*`
- State: Zustand (`src/store/`), TanStack Query, Axios API client (`src/lib/`)
- Types: `src/types/`
- Env: `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`

### Database

- PostgreSQL 16 via Docker: `localhost:5432`, db `tour_op_db`, user `tour_op_user`
- Redis 7 via Docker: `localhost:6379`, password required (`redis_pass_2024`)
- pgAdmin: `http://localhost:5050` (admin@tourop.com / admin123)

## Important Gotchas

- **Prisma 7 config must be at project root** (`apps/api/prisma.config.ts`), NOT inside `prisma/` folder. Uses `defineConfig` with `datasource.url: env('DATABASE_URL')` and `import 'dotenv/config'`.
- **Prisma 7 uses `@prisma/adapter-pg`** (not the default driver). The seed file uses a `pg.Pool` + `PrismaPg` adapter pattern.
- **Both `seed.js` and `seed.ts` exist.** `seed.js` works (`node prisma/seed.js`). `seed.ts` was fixed — requires `import * as pg from 'pg'` and `import { PrismaPg } from '@prisma/adapter-pg'`.
- **No separate Jest config** — uses NestJS CLI defaults. No `test/` directory currently exists.
- **Redis requires password** — `REDIS_PASSWORD=redis_pass_2024` in `.env`.
- **JWT secrets are placeholder values** in `.env` — fine for dev, must be rotated for prod.
- **SKILL.md describes an aspirational architecture** (React+Vite frontend, MinIO storage) that does NOT match the actual codebase (Next.js 15, no MinIO). Trust the code over SKILL.md for implementation details.
- **`strict: false`** in web tsconfig — TypeScript is lenient on the frontend.
- **`noImplicitAny: false`** in api tsconfig — TypeScript allows implicit any in the backend.

## Code Style

- Prettier: `singleQuote: true`, `semi: true`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`
- VSCode: `prisma.pinToPrisma6: false` (using Prisma 7)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@demotourop.com | Admin@123456 |
| Sales | sales@demotourop.com | Password@123 |
| OP | op@demotourop.com | Password@123 |
| Finance | finance@demotourop.com | Password@123 |
| Guide | guide@demotourop.com | Password@123 |

## Phase Status

- Phase 1: Foundation (Monorepo, Docker, NestJS, Prisma, Auth, RBAC)
- Phase 2: Customers + Suppliers + Frontend shell
- Phase 3: Leads CRM + Quotation Builder
- Phase 4 (planned): Tours + Bookings + Finance (AR/AP)
