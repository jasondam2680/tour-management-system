require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const user = await prisma.user.findUnique({
    where: { id: 'cmp9ov0j30001ao7bsce186yi' },
    select: { id: true, email: true, organizationId: true },
  });
  console.log('User:', JSON.stringify(user));

  await prisma.disconnect();
  await pool.end();
}

main().catch(console.error);
