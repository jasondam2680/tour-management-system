# 🌏 Tour OP System

> Open-source Tour Operator Management System for small travel agencies to manage customers, leads, quotations, and tour operations — all in one place.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Phase](https://img.shields.io/badge/Phase-4%20in%20progress-yellow)]()
[![Stack](https://img.shields.io/badge/Stack-Next.js%2015%20%2B%20NestJS%20%2B%20PostgreSQL-blue)]()

---

## ✨ What it does

Tour OP System helps travel agencies and tour operators:

- 📋 **Manage customers & suppliers** with full contact history
- 🎯 **Track sales leads** with a Kanban pipeline (New → Qualified → Proposal → Won/Lost)
- 💰 **Build quotations** with automatic pricing calculation
- 📦 **Book tours & manage bookings** *(Phase 4 — in progress)*
- 💵 **Finance tracking** — Accounts Receivable / Payable *(Phase 4 — in progress)*

---

## 🛠 Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand    |
| Backend  | NestJS, TypeScript, Prisma 7, PostgreSQL         |
| Infra    | Docker, Redis, pgAdmin, GitHub Codespaces        |

---

## 🚀 Quick Start

See the full setup guide in [`tour-op-system/README.md`](tour-op-system/README.md)

**TL;DR:**
```bash
cd tour-op-system
docker-compose up -d         # Start PostgreSQL + Redis + pgAdmin
cd apps/api && npm install && npx prisma migrate dev && node prisma/seed.js
cd ../web && npm install && npm run dev
```

Open http://localhost:3000 — login with `admin@demotourop.com` / `Admin@123456`

---

## 📊 Project Status

| Phase | What | Status |
|-------|------|--------|
| Phase 1 | Foundation — Monorepo, Docker, Auth, RBAC | ✅ Done |
| Phase 2 | Customers + Suppliers + Frontend shell | ✅ Done |
| Phase 3 | Leads CRM + Quotation Builder | ✅ Done |
| Phase 4 | Tours + Bookings + Finance (AR/AP) | ⚠️ 40% |

**Overall: ~65% complete**

---

## 🤝 Contributing

This project is in early stages and welcomes contributions!
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. *(coming soon)*

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details. *(coming soon)*