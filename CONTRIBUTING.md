# Contributing to Tour OP System

First off, thank you for considering contributing! 🎉

This project is built for small travel agencies and tour operators. Every contribution — whether it's fixing a bug, improving docs, or suggesting a feature — makes it better for the whole community.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Commit Message Convention](#commit-message-convention)

---

## Code of Conduct

Be kind, be respectful. We welcome contributors of all backgrounds and experience levels. Harassment or discrimination of any kind will not be tolerated.

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before opening a bug report, please check if the issue already exists. When creating a new issue:

- Use the **Bug Report** template
- Include steps to reproduce the problem
- Mention your OS, Node.js version, and browser
- Attach screenshots if relevant

### 💡 Suggesting Features

Open a **Feature Request** issue and describe:

- What problem does it solve?
- Who would benefit? (e.g., tour operators, agency staff)
- Any examples from other tools you've seen?

### 🔧 Good First Issues

Look for issues labeled [`good first issue`](../../issues?q=is%3Aopen+label%3A%22good+first+issue%22) — these are beginner-friendly tasks with clear instructions.

---

## Development Setup

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git

### Steps

```bash
# 1. Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/tour-management-system.git
cd tour-management-system/tour-op-system

# 2. Start infrastructure
docker-compose up -d

# 3. Setup API
cd apps/api
npm install
cp ../../.env.example ../../.env   # fill in your values
npx prisma migrate dev
node prisma/seed.js
npm run start:dev

# 4. Setup Web (new terminal)
cd apps/web
npm install
npm run dev
```

Open http://localhost:3000 — login: `admin@demotourop.com` / `Admin@123456`

---

## Pull Request Process

1. **Fork** the repo and create your branch from `master`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** — keep each PR focused on one thing.

3. **Test your changes** manually and make sure nothing is broken.

4. **Commit** using the convention below.

5. **Open a Pull Request** against the `master` branch with:
   - A clear title
   - Description of what changed and why
   - Screenshots for UI changes

6. Wait for review — we aim to respond within **3–5 business days**.

---

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):
<type>: <short description>

Types:
feat → New feature
fix → Bug fix
docs → Documentation only
style → Formatting, no logic change
refactor → Code change without feature/fix
chore → Build process, dependencies
test → Adding or fixing tests

**Examples:**
feat: add booking status filter to tour list
fix: correct total calculation in quotation builder
docs: update docker setup instructions
chore: upgrade prisma to v7

---

## Questions?

Open a [Discussion](../../discussions) or tag `@jasondam2680` in an issue. We're happy to help!