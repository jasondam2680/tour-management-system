#!/usr/bin/env bash
set -euo pipefail
cd /workspace
echo "Installing root dependencies..."
if [ -f package-lock.json ] || [ -f package.json ]; then
  npm ci || true
fi
if [ -d apps/api ]; then
  echo "Installing apps/api..."
  cd apps/api
  npm ci || true
  if [ -f prisma/schema.prisma ]; then
    npx prisma generate --schema=prisma/schema.prisma || true
  fi
  cd /workspace
fi
if [ -d apps/web ]; then
  echo "Installing apps/web..."
  cd apps/web
  npm ci || true
  cd /workspace
fi
echo "Post-create script finished."
