require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const org = await prisma.organization.findFirst();
  if (!org) {
    console.log('No organization found');
    await prisma.$disconnect();
    return;
  }
  console.log('Organization:', org.id, org.name);

  const users = await prisma.user.findMany();
  const usersToUpdate = users.filter((u) => u.organizationId === null);
  console.log(`Users without organizationId: ${usersToUpdate.length}`);

  for (const user of usersToUpdate) {
    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id },
    });
    console.log(`Updated user: ${user.email}`);
  }

  console.log('Done!');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
