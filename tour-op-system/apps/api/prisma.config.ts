// @ts-nocheck
import 'dotenv/config';
import path from 'node:path';
import { defineConfig, env } from 'prisma/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'node prisma/seed.js',
  },
});
