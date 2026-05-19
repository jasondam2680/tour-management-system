#!/usr/bin/env bash
set -euo pipefail
cd /workspace
echo "Installing root dependencies..."
if [ -f package-lock.json ]; then
  npm ci
elif [ -f package.json ]; then
  npm install
fi
if [ -d apps/api ]; then
  echo "Installing apps/api..."
  cd apps/api
  if [ -f package-lock.json ]; then
    npm ci
  elif [ -f package.json ]; then
    npm install
  fi
  if [ -f prisma/schema.prisma ]; then
    npx prisma generate --schema=prisma/schema.prisma
  fi
  cd /workspace
fi
if [ -d apps/web ]; then
  echo "Installing apps/web..."
  cd apps/web
  if [ -f package-lock.json ]; then
    npm ci
  elif [ -f package.json ]; then
    npm install
  fi
  cd /workspace
fi
echo "Post-create script finished."
