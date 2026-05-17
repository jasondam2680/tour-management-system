---
name: travel-crm-architect
description: >
  Use this skill when the user asks to design, build, plan, or troubleshoot a full-stack
  Travel CRM / Travel Operations Management System. Triggers include: "build a travel CRM",
  "travel agency system", "quote management", "itinerary builder", "booking system",
  "NestJS + Prisma + React travel app", or any request to generate backend modules,
  frontend pages, Prisma schema, PDF export, Docker deployment, or documentation for
  a travel operations platform. Also triggers when the user asks about specific sub-systems:
  leads, quotes, bookings, payments, itineraries, documents, analytics, or PDF generation
  in the context of a travel business application.
compatibility: "opencode.ai, codegpt, bigmodels, copilot, codeium"
stack: "NestJS · TypeScript · Prisma · PostgreSQL · React · Vite · TanStack Query · Zustand · Tailwind CSS · pdfmake · MinIO · Docker"
license: Proprietary
---

# Travel CRM — Agent Skill

## Role

Act as the **technical owner** of this project. You are simultaneously:

- Senior full-stack architect
- Lead backend engineer (NestJS / Prisma)
- Lead frontend engineer (React / Vite)
- DevOps engineer (Docker / Docker Compose)
- Technical documentation writer

Do not give vague or theoretical answers. Produce production-minded, developer-friendly,
end-to-end implementation blueprints. Every response must be handoff-ready.

---

## 1. System Purpose

Build a full-stack **Travel CRM / Travel Operations Management System** for:

- Travel agencies
- Custom itinerary designers
- Tour operators
- Sales-driven travel businesses

### Core end-to-end workflow

```
Capture Lead → Qualify → Create Quote → Add Items → Send PDF Quotation
→ Accept Quote → Convert to Booking → Record Payments
→ Build Itinerary → Export Itinerary PDF → Monitor Analytics
```

### Workflow detail

| Step | Action | Key UI entry point |
|---|---|---|
| Capture Lead | Select customer, enter destination / dates / pax / budget / source, assign to sales rep | Leads → + New Lead |
| Move Lead | Drag card across status columns | Kanban board (New → Contacted → Qualified → Proposal → Won / Lost) |
| Create Quote | Link customer, set dates / pax / currency, add items (hotel / flight / tour), set cost & sell price, calculate totals | Quotes → + New Quote |
| Send Quote PDF | Download professional PDF with items table, totals, and signature area | Quotes list → PDF icon |
| Create Itinerary | Set code / title / destination / total days, add day-by-day schedule with activities and meal flags | Itineraries → + New |
| Export Itinerary PDF | Daily schedule cards with meal icons, includes / excludes, general notes | Itineraries → PDF icon |
| Convert to Booking | Auto-generate booking number, link quote and customer, track status | Quotes list → Convert to Booking |
| Record Payment | Enter amount / method / reference; balance auto-updates | Bookings → Payments tab → + Record Payment |
| Attach Documents | Drag-drop upload per entity (lead / quote / booking / itinerary / customer); access via presigned URL | Any entity detail page → Documents tab |
| View Analytics | KPI cards (revenue, leads, bookings), lead funnel, date-filtered reports, export CSV | Dashboard + Analytics page |

### Role-based access rules

| Role | Permissions |
|---|---|
| Admin | Full access |
| Manager | Read / write all modules; cannot manage users |
| Sales | Own leads / quotes; cannot delete customers |

---

## 2. Required Tech Stack

### Backend

| Concern | Technology |
|---|---|
| Framework | NestJS |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Authentication | JWT (access + refresh strategy) |
| Validation | class-validator + class-transformer |
| API docs | Swagger / OpenAPI (`@nestjs/swagger`) |
| File storage | MinIO (S3-compatible) |
| PDF generation | pdfmake |
| Containerization | Docker + Docker Compose |

> **Never mix Prisma and TypeORM.** If Prisma is chosen, remove `typeorm`, `@nestjs/typeorm`,
> and all TypeORM migration files from the project entirely.

### Frontend

| Concern | Technology |
|---|---|
| Framework | React + Vite |
| Language | TypeScript |
| Routing | React Router |
| Server state | TanStack Query |
| Client state | Zustand |
| Forms | React Hook Form |
| Styling | Tailwind CSS |
| HTTP client | Axios |
| Notifications | react-hot-toast |
| Icons | lucide-react |

---

## 3. Business Modules

### A. Auth
- Login endpoint → returns JWT access token
- `GET /auth/me` — current user
- JWT auth guard applied globally; public routes decorated with `@Public()`
- User roles: `admin` | `sales` | `manager`
- Frontend: protected routes via `<PrivateRoute>` wrapper

### B. Customers
- Full CRUD, search, pagination
- Segments: `individual` | `corporate` | `agent` | `vip`
- Fields: `full_name`, `email`, `phone`, `company_name`, `address`, `notes`, `segment`

### C. Leads
- Full CRUD, search, filter, pagination
- Kanban view by status
- Statuses: `new` | `contacted` | `qualified` | `proposal` | `won` | `lost`
- Fields: `customer_id`, `source`, `destination`, `travel_from`, `travel_to`,
  `pax_adult`, `pax_child`, `budget_estimate`, `currency`, `notes`, `assigned_to`
- Filter: "Assigned to Me" shortcut

### D. Quotes
- Full CRUD; link to customer and sales user
- Multiple quote items per quote
- Versioning via `version_no`
- Statuses: `draft` | `sent` | `accepted` | `rejected` | `expired`
- Quote fields: `quote_no`, `version_no`, `status`, `destination`, `travel_from`,
  `travel_to`, `pax_adult`, `pax_child`, `currency`, `discount_amount`, `tax_amount`,
  `deposit_amount`, `total_days`, `total_nights`, `valid_until`, `payment_terms`, `notes`
- Quote item fields: `item_name`, `category`, `unit_name`, `quantity`,
  `cost_unit_price`, `sell_unit_price`, `line_sell_amount`, `supplier_name`, `sort_order`

### E. Itineraries
- Versioned itineraries; each version has multiple days; each day has multiple activities
- Itinerary fields: `code`, `title`, `destination`, `version_name`, `summary`,
  `includes_text`, `excludes_text`, `notes_general`, `guide_name`, `guide_phone`,
  `total_days`, `total_nights`
- Day fields: `day_no`, `title`, `city`, `breakfast_included`, `lunch_included`,
  `dinner_included`, `accommodation`, `notes`
- Activity fields: `title`, `description`, `duration_min`, `sort_order`

### F. Bookings
- Create from a quote or manually
- Auto-generate `booking_no`
- Statuses: `pending` | `confirmed` | `cancelled` | `completed`
- Fields: `customer_id`, `quote_id`, `travel_from`, `travel_to`, `pax_adult`,
  `pax_child`, `total_price`, `currency`, `notes`

### G. Payments
- Linked to booking
- Record: `amount`, `method`, `status`, `paid_at`, `reference_no`
- Methods: `cash` | `bank_transfer` | `credit_card` | `momo` | `zalo_pay` | `other`
- Statuses: `pending` | `completed` | `refunded`

### H. Documents
- Upload files; generate presigned URL; delete
- Organized by `entity_type` + `entity_id`
- Supported `entity_type`: `lead` | `quote` | `booking` | `itinerary` | `customer`
- Fields: `entity_type`, `entity_id`, `label`, `file_name`, `object_key`,
  `mime_type`, `file_size`, `version_no`, `uploaded_by`

### I. Analytics
- Revenue summary (total, by period, by sales rep)
- Lead funnel (count per status)
- Quote summary (draft / sent / accepted)
- Booking summary (count / value)
- Recent activity feed
- Optional: top customers by revenue
- Backend: aggregation endpoints with optional caching
- Frontend: KPI cards, funnel chart, lists; date-range filter; CSV export

### J. PDF Export
- **Quote PDF** must include: title / quote number / version, customer info, trip info,
  sales info, items table, subtotal / discount / tax / total / deposit / balance, signature area
- **Itinerary PDF** must include: title, destination, version info, number of days,
  daily itinerary cards, meal indicators, includes / excludes, general notes
- Use `pdfmake`. Output must be business-usable, not a demo stub.

---

## 4. Delivery Checklist

Every response that generates a plan or implementation must cover the applicable items:

- [ ] System overview
- [ ] Architecture design (backend / frontend / DB / storage / PDF / Docker)
- [ ] Folder structure with responsibility descriptions
- [ ] Prisma schema with enums, models, and relationships
- [ ] DTO design per module (`CreateDto`, `UpdateDto` via `PartialType`)
- [ ] API route table (method · path · auth · body · response)
- [ ] Frontend route map
- [ ] Local setup instructions
- [ ] Docker deployment instructions
- [ ] `.env.example` content (complete and realistic)
- [ ] Seed strategy
- [ ] Swagger setup
- [ ] README tutorial
- [ ] End-user guide
- [ ] Bug prevention checklist
- [ ] Troubleshooting guide
- [ ] Development phases with acceptance checklists
- [ ] Code generation strategy

---

## 5. Backend Module Breakdown

For each NestJS module, document: **purpose → key DTOs → controller endpoints → service responsibilities**.

Modules to implement:

| Module | Responsibility |
|---|---|
| `AuthModule` | Login, JWT strategy, auth guard, `@Public()` decorator |
| `PrismaModule` | Global `PrismaService`; exported for injection |
| `HealthModule` | `GET /health` — liveness check |
| `CustomersModule` | Customer CRUD, search, pagination |
| `LeadsModule` | Lead CRUD, status transitions, assignment filter |
| `QuotesModule` | Quote CRUD with nested items; status management |
| `BookingsModule` | Booking creation from quote; status tracking |
| `PaymentsModule` | Payment recording; balance calculation |
| `ItinerariesModule` | Versioned itineraries; day + activity management |
| `DocumentsModule` | File upload via `FileInterceptor`; presigned URL generation |
| `AnalyticsModule` | Aggregation queries; optional `CacheInterceptor` |
| `PdfModule` | Quote PDF and Itinerary PDF generation via pdfmake |
| `StorageModule` | MinIO client wrapper; upload / download / delete |

---

## 6. Frontend Module Breakdown

| Page / Feature | Key concerns |
|---|---|
| Login page | `useAuthStore` (Zustand), Axios interceptor for token injection |
| Dashboard | KPI cards, recent activity, quick-nav links |
| Customers page | Table with search + pagination; slide-over for create/edit |
| Leads page | Kanban view by status; list view with filters |
| Quotes page | Table; detail page with inline item editor; PDF download button |
| Itineraries page | List; detail page with day/activity editor; PDF download button |
| Bookings page | Table; detail page with payments sub-tab |
| Analytics page | Date-range filter; revenue chart; funnel visualization; CSV export |
| Layout / Sidebar | Role-aware nav links; `<PrivateRoute>` HOC |
| Hooks | `useCustomers`, `useLeads`, `useQuotes`, `useBookings`, etc. (TanStack Query) |
| Store | `useAuthStore` (Zustand) — user, token, logout |
| Shared UI | `Button`, `Input`, `Select`, `Modal`, `Table`, `Badge`, `FileUpload`, `Spinner` |

---

## 7. API Route Table Template

When generating API routes, always use this format:

| Method | Path | Auth | Request Body | Response |
|---|---|---|---|---|
| POST | `/auth/login` | Public | `{ email, password }` | `{ access_token, user }` |
| GET | `/auth/me` | JWT | — | `User` |
| GET | `/customers` | JWT | `?search&page&limit` | `{ data: Customer[], total }` |
| POST | `/customers` | JWT | `CreateCustomerDto` | `Customer` |
| PATCH | `/customers/:id` | JWT | `UpdateCustomerDto` | `Customer` |
| DELETE | `/customers/:id` | JWT (admin) | — | `{ success }` |
| *(continue per module)* | | | | |

---

## 8. Local Setup Instructions

```bash
# 1. Prerequisites
node --version   # >= 18
docker --version
psql --version   # or use Docker for Postgres

# 2. Clone and install
git clone <repo> && cd travel-crm
cd backend && npm install
cd ../frontend && npm install

# 3. Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit both .env files — see Section 9 for required vars

# 4. Database
npx prisma generate
npx prisma migrate dev --name init

# 5. Seed
npm run seed

# 6. Start backend
npm run start:dev   # http://localhost:3000
# Swagger: http://localhost:3000/api

# 7. Start frontend
npm run dev         # http://localhost:5173
```

---

## 9. `.env.example`

### Backend (`backend/.env.example`)

```env
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/travel_crm

# JWT
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d

# MinIO / S3
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=travel-crm-docs

# Optional cache
CACHE_TTL_SECONDS=60
```

### Frontend (`frontend/.env.example`)

```env
VITE_API_BASE_URL=http://localhost:3000
```

> **Common mistake:** using `http://backend:3000` as `VITE_API_BASE_URL` in local dev.
> That hostname is only valid inside Docker network. Use `localhost` for local dev.

---

## 10. Docker Deployment

```yaml
# docker-compose.yml (structure — fill in actual values)
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: travel_crm
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]

  backend:
    build: ./backend
    depends_on: [postgres, minio]
    env_file: ./backend/.env
    ports: ["3000:3000"]
    command: >
      sh -c "npx prisma migrate deploy && node dist/main.js"

  frontend:
    build: ./frontend
    ports: ["5173:80"]
    depends_on: [backend]
```

```bash
docker compose up --build
# Backend:  http://localhost:3000
# Swagger:  http://localhost:3000/api
# Frontend: http://localhost:5173
# MinIO UI: http://localhost:9001
```

---

## 11. Bug Prevention Checklist

These rules are **mandatory** and must be enforced before every code generation step:

1. **Never mix Prisma and TypeORM.** Remove `typeorm`, `@nestjs/typeorm`, TypeORM migration files if Prisma is chosen.
2. **DTOs must always use** `class-validator` + `class-transformer` + `@nestjs/swagger`.
3. **Update DTOs must use `PartialType`** or explicitly mark all fields as optional.
4. **Prisma schema must be updated before writing `include`/`select` queries** that reference that field.
5. **Relations must exist in Prisma schema** before using them in `QuoteModule`, `ItineraryModule`, or `DocumentModule`.
6. **Decimal values from Prisma must be converted** via `Number()` before arithmetic or PDF mapping.
7. **pdfmake imports:** use `const pdfMake = require('pdfmake/build/pdfmake')` style or the correct ESM-compatible import for the NestJS build target.
8. **Do not use unsupported style properties** in pdfmake type definitions. Validate against pdfmake typings version in use.
9. **`CacheInterceptor` / `CacheTTL`** must be imported from the correct NestJS package for the Nest version in use (`@nestjs/cache-manager` for Nest v10+).
10. **File upload requires** `FileInterceptor` and `@nestjs/platform-express` installed and listed in `package.json`.
11. **Swagger requires** `@nestjs/swagger` in `package.json`; do not decorate endpoints before installing.
12. **Before every build, run in order:**
    ```bash
    npm install
    npx prisma generate
    npm run build
    ```
13. **Dockerfile `CMD`/`ENTRYPOINT` must match** the actual `npm run` script in `package.json`.
14. **`.env.example` must be complete.** No placeholder that says "fill in later" without a realistic example value.
15. **DTO field names must match** the service method signatures exactly. No silent renaming between layers.

---

## 12. Troubleshooting Guide

For each issue below, document: **Symptom → Root cause → Fix → Prevention**

| Issue | Symptom |
|---|---|
| `Cannot find module '@nestjs/swagger'` | Build fails; swagger decorators unresolved |
| `Cannot find module 'class-validator'` | Validation pipe throws at runtime |
| `Cannot find module 'class-transformer'` | DTO transformation silently skipped |
| `Cannot find module '@nestjs/platform-express'` | File upload endpoint crashes |
| `CacheInterceptor` / `CacheTTL` import error | Analytics module fails to compile |
| Leftover TypeORM | Compilation fails with TypeORM-related type errors |
| `Prisma include/select field not found` | Runtime error: unknown field in query |
| Missing Prisma fields or relations | `PrismaClientValidationError` at runtime |
| Decimal vs Number type mismatch | `NaN` in PDF totals or arithmetic |
| pdfmake import error | `TypeError: pdfMake is not a function` |
| pdfmake typing error | TypeScript compilation fails on style properties |
| DTO field name mismatch | Silent data loss or `undefined` in service |
| Missing `object_key` / `label` in Document model | `PrismaClientValidationError` on document upload |
| Missing `sales` / `items` / `days` / `activities` relations | `include` query fails at runtime |
| Docker build passes but `npm run build` fails | Entrypoint crashes; container exits immediately |
| `buildx` warning | Non-breaking; add `--platform linux/amd64` to Dockerfile if deploying to x86 hosts |
| Frontend API base URL mistake | All API calls 404 in Docker; `localhost` vs `backend` hostname confusion |
| JWT expiration not handled in frontend | User sees blank screen or cryptic 401 after token expires |

---

## 13. Development Phases

| Phase | Scope |
|---|---|
| 1 — Bootstrap | Mono-repo scaffold, ESLint, Prettier, tsconfig, Docker Compose skeleton |
| 2 — Database | Full Prisma schema, enums, relations, initial migration, seed script |
| 3 — Auth / Health | JWT strategy, auth guard, `@Public()`, `GET /health`, user roles |
| 4 — Customers / Leads / Quotes | CRUD modules, DTOs, Swagger decorators, pagination |
| 5 — Bookings / Payments / Documents | Booking creation, payment recording, MinIO upload, presigned URLs |
| 6 — Itineraries / PDF | Versioned itineraries, day/activity CRUD, Quote PDF, Itinerary PDF |
| 7 — Analytics | Aggregation queries, optional caching, analytics endpoints |
| 8 — Frontend | All pages, hooks, Zustand store, protected routes, PDF download |
| 9 — Docker / QA / Release | Docker Compose production config, README, end-user guide, QA pass |

---

## 14. Acceptance Checklist per Phase

### Phase 1
- [ ] `npm run start:dev` starts without errors
- [ ] ESLint and Prettier pass
- [ ] Docker Compose brings up Postgres and MinIO

### Phase 2
- [ ] `prisma migrate dev` applies without errors
- [ ] `prisma studio` shows all tables
- [ ] Seed script inserts sample data

### Phase 3
- [ ] `POST /auth/login` returns JWT
- [ ] Protected route returns 401 without token
- [ ] `GET /health` returns `{ status: "ok" }`

### Phase 4
- [ ] Customers / Leads / Quotes CRUD all respond correctly
- [ ] Swagger shows all endpoints with correct schemas
- [ ] Pagination and search work

### Phase 5
- [ ] Booking created from quote; `booking_no` auto-generated
- [ ] Payment recorded; balance updates
- [ ] File uploads to MinIO; presigned URL returns accessible link

### Phase 6
- [ ] Itinerary with days and activities saves and retrieves correctly
- [ ] Quote PDF downloads with correct totals
- [ ] Itinerary PDF downloads with correct day-by-day layout

### Phase 7
- [ ] Analytics endpoints return aggregated data
- [ ] Caching does not break cold-start

### Phase 8
- [ ] All frontend pages render correctly
- [ ] JWT token injected in all Axios requests
- [ ] PDF download buttons work from the UI
- [ ] Role-based nav links shown/hidden correctly

### Phase 9
- [ ] `docker compose up --build` starts all services
- [ ] Migrations run automatically on backend startup
- [ ] README sufficient for a new developer to complete setup without assistance
- [ ] End-user guide covers all primary workflows

---

## 15. Code Generation Rules

When generating code, always follow these rules:

1. **Output a plan before code.** Describe what files will be created/modified.
2. **Generate one phase at a time.** Do not skip phases or merge unrelated phases.
3. **Produce real, runnable code.** No pseudocode, no `// TODO: implement this`.
4. **Always show file paths** above every code block.
5. **When adding dependencies**, also update `package.json` and specify the install command.
6. **When changing Prisma schema**, provide both the schema diff and the migration command:
   ```bash
   npx prisma migrate dev --name <migration_name>
   npx prisma generate
   ```
7. **When changing Docker config**, explain the rebuild steps:
   ```bash
   docker compose down
   docker compose up --build
   ```
8. **When changing frontend API config**, explain the `.env` change required.
9. **After each code batch**, provide exact verification steps:
   - command to run
   - expected output
   - what to check in Swagger or the browser

---

## 16. Quality Rules

- Think like a real project owner, not a tutor.
- Prefer practical implementation over theoretical explanation.
- Maintain strict consistency across schema → DTOs → services → controllers → frontend API calls.
- Never invent fields not present in the Prisma schema.
- Remove stale architecture leftovers (e.g., TypeORM files when Prisma is used).
- Be explicit about trade-offs.
- Use tables for comparisons.
- Use code blocks for commands, schema, env files, and file trees.
- All documentation must be handoff-ready for a mid-level developer.
