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

### Cách nhanh nhất — 1 lệnh (khuyên dùng, chạy được cả trên Codespaces)

```bash
cd tour-op-system
bash scripts/setup.sh
```

Script tự làm hết theo đúng thứ tự:
1. Kiểm tra Docker đang chạy
2. Đọc `POSTGRES_DB/USER/PASSWORD` từ `docker-compose.yml` → **ghi đè `DATABASE_URL`
   trong `apps/api/.env` cho khớp** (bạn không cần sửa tay, không bao giờ lệch)
3. `docker compose up -d postgres` + chờ healthy
4. Tự tạo database nếu chưa có
5. Kiểm tra kết nối (báo lỗi tiếng Việt, chỉ đúng chỗ sai)
6. `prisma generate` → `prisma migrate dev`

Muốn kèm dữ liệu demo: `bash scripts/setup.sh --seed`.

> ⚠️ **Đừng sửa `docker-compose.yml` thủ công** (đổi tên DB/user/port) trừ khi bạn hiểu rõ:
> `setup.sh` luôn lấy giá trị từ file này làm chuẩn. Sửa sai 1 chỗ là lệch cả dây chuyền.

### Làm thủ công (nếu không dùng script)

#### 1. Start databases

```bash
docker compose up -d
# PostgreSQL → localhost:5432  (compose map 5432:5432 — từ máy host/Codespaces dùng 5432!)
# Redis      → localhost:6379
# pgAdmin    → http://localhost:5050 (admin@tourop.com / admin123)
```

#### 2. Install dependencies

```bash
# Root
npm install

# Backend
cd apps/api && npm install

# Frontend
cd apps/web && npm install
```

#### 3. Cấu hình database

```bash
cd tour-op-system
npm run db:check
```

Lệnh này đọc `DATABASE_URL` trong `apps/api/.env` và chẩn đoán từng bước
(DNS → TCP → đăng nhập → database), in tiếng Việt đúng chỗ sai và cách sửa.
Nếu chưa có `apps/api/.env`, copy từ `.env.example` — **đọc kỹ 2 mục HOST vs
DEVCONTAINER trong file đó**, chọn đúng 1 mục theo nơi bạn chạy lệnh.

Quy tắc vàng:
- Chạy lệnh trên **máy host / Codespaces** → host nên là `127.0.0.1`, port **5432**:
  `postgresql://tour_op_user:<POSTGRES_PASSWORD>@127.0.0.1:5432/tour_op_db`
  (password xem trong `docker-compose.yml`).
  Vì sao không dùng `localhost`? `localhost` có thể resolve ra IPv6 `::1` trước,
  và trong Codespaces có thể có service khác chiếm `[::1]:5432` → pg nối nhầm.
  `127.0.0.1` luôn trỏ đúng docker-proxy.
- Chạy **trong devcontainer** → mới dùng `db:5432`:
  `postgresql://dev:dev@db:5432/devdb`

#### 4. Migrate + seed

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (tự chạy db:check trước)
npm run db:migrate

# Seed demo data (tùy chọn)
npm run db:seed
```

#### 5. Start development servers

```bash
# Terminal 1 — Backend (port 3001)
cd apps/api
npm run dev

# Terminal 2 — Frontend (port 3000)
cd apps/web
npm run dev
```

> **Codespaces:** không cần cấu hình gì thêm. Web tự suy ra API URL từ hostname
> (`<name>-3000.app.github.dev` → `<name>-3001.app.github.dev`), và API tự cho phép
> CORS origin `*.app.github.dev` khi chạy dev. Chỉ cần forward cả 2 port 3000 và 3001.

### Xử lý sự cố database

| Lỗi | Nguyên nhân | Cách sửa |
| --- | ----------- | -------- |
| Docker `ports are not available` / `bind: An attempt was made to access a socket ... forbidden by its access permissions` khi mở `5432` | Windows không cho Docker bind `5432` vì port đang được dùng hoặc nằm trong dải port bị loại trừ | Giữ map `'5432:5432'` nếu cần dùng đúng port này. Trên PowerShell kiểm tra tiến trình đang nghe bằng `Get-NetTCPConnection -LocalPort 5432 -State Listen` và dải port bị loại trừ bằng `netsh interface ipv4 show excludedportrange protocol=tcp`; giải phóng xung đột/điều chỉnh cấu hình Windows rồi chạy lại `docker compose up -d postgresql`. |
| `P1001: Can't reach database server at db:5432` | Dùng URL của devcontainer (`db:5432`) nhưng chạy lệnh trên host/Codespaces — host `db` không tồn tại ở ngoài | Dùng URL `localhost:5432` (mục HOST trong `.env.example`), hoặc chạy `bash scripts/setup.sh` để tự sửa |
| `ECONNRESET` sau khi "mở được cổng TCP" | Map sai port trong `docker-compose.yml`: số sau dấu `:` phải là **5432** | Sửa lại thành `'5432:5432'` rồi `docker compose up -d postgresql` |
| `Connection terminated unexpectedly` (không mã lỗi) | Có thứ khác (không phải Postgres) đang nghe trên port — thường do `localhost` resolve ra IPv6 `::1` bị service khác chiếm, hoặc map sai port | Dùng `127.0.0.1` thay vì `localhost` trong `DATABASE_URL` (`bash scripts/setup.sh` đã tự làm). Vẫn lỗi → kiểm tra tiến trình đang dùng port 5432 và chạy `docker logs tour_op_postgres --tail 30` xem Postgres có log gì |
| `P1001` nhưng `npm run db:check` lại báo OK | Shell đang export `DATABASE_URL` cũ — Prisma (qua dotenv) ưu tiên biến shell hơn file `.env` | Chạy `unset DATABASE_URL` rồi migrate lại. Nếu mở terminal mới vẫn bị → xóa dòng `export DATABASE_URL` trong `~/.bashrc`. `db-check` bản mới tự phát hiện và báo đúng bệnh này |
| `28P01: password authentication failed` | Sai password, hoặc volume `postgres_data` được init từ lần chạy trước với user/password khác | Password đúng xem trong `docker-compose.yml`. Nếu từng sửa compose rồi up lại → `docker compose down -v` (xóa dữ liệu dev) rồi up lại |
| `3D000: database does not exist` | Tên database trong URL không khớp với `POSTGRES_DB` lúc init volume | `bash scripts/setup.sh` tự tạo DB; hoặc sửa URL cho khớp |
| `pg_isready` ✓ nhưng app không kết nối được | `docker exec` chạy trong container (không qua port mapping) nên luôn ✓ — đừng tin nó, hãy tin `npm run db:check` | Chạy `npm run db:check` để chẩn đoán đúng |

### Devcontainer / Codespaces

- Mở project bằng devcontainer (VS Code "Reopen in Container"): trong mạng nội bộ
  container, Postgres có hostname `db`, dùng URL `postgresql://dev:dev@db:5432/devdb`
  (xem `.devcontainer/docker-compose.yml`).
- Trên **Codespaces terminal thường** (không vào devcontainer): vẫn là môi trường
  "host" → dùng `bash scripts/setup.sh` như bình thường.

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

## Permanent Production Deployment

The repository now includes a production-ready Docker Compose stack with PostgreSQL, the NestJS API, the Next.js web application, and Caddy as the HTTPS reverse proxy. Caddy automatically obtains and renews TLS certificates when the domain DNS points to the deployment server.

1. Copy `.env.production.example` to `.env.production` and set a real domain, strong PostgreSQL password, and two different strong JWT secrets.
2. Point the domain's A/AAAA records to the deployment server and ensure ports `80` and `443` are open.
3. Build and start the stack:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

4. Apply the schema migrations once:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml run --rm api npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

5. Seed demo data only for a non-production/demo environment:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml run --rm api node apps/api/dist/prisma/seed.js
```

The production web image receives `NEXT_PUBLIC_API_URL` at build time and uses the same-domain `/api/v1` path, avoiding browser CORS problems. The API accepts a comma-separated `FRONTEND_URL` list and binds to `HOST` (default `0.0.0.0`). Do not use the demo credentials or seed script on a public production database.

## Authentication and Demo Accounts

The executable seed is idempotent for demo access: rerunning it refreshes the demo password hashes and reactivates the accounts. This prevents stale hashes or inactive users from causing misleading login failures. The current demo credentials are shown on the login screen and should be changed or removed before production use.

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
