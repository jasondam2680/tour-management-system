import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as pg from 'pg';
import * as bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL
  || 'postgresql://tour_op_user:tour_op_pass_2024@localhost:5432/tour_op_db';
const pool    = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  const org = await prisma.organization.upsert({
    where: { code: 'DEMO_OP' },
    update: {},
    create: {
      name: 'Demo Tour Operator',
      code: 'DEMO_OP',
      email: 'info@demotourop.com',
      phone: '+84901234567',
      address: '123 Nguyen Hue, District 1, HCMC',
      country: 'VN',
      currency: 'VND',
    },
  });
  console.log('✅ Organization:', org.name);

  const adminHash = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@demotourop.com' },
    update: {
      organizationId: org.id,
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      organizationId: org.id,
      email: 'admin@demotourop.com',
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log('✅ Admin: admin@demotourop.com / Admin@123456');

  const users: { email: string; first: string; last: string; role: UserRole }[] = [
    { email: 'sales@demotourop.com',   first: 'Sales',   last: 'Manager', role: UserRole.SALES },
    { email: 'op@demotourop.com',      first: 'OP',      last: 'Team',    role: UserRole.OP },
    { email: 'finance@demotourop.com', first: 'Finance', last: 'Team',    role: UserRole.FINANCE },
    { email: 'guide@demotourop.com',   first: 'Tour',    last: 'Guide',   role: UserRole.GUIDE },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash('Password@123', 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        organizationId: org.id,
        passwordHash: hash,
        firstName: u.first,
        lastName: u.last,
        role: u.role,
        status: UserStatus.ACTIVE,
      },
      create: {
        organizationId: org.id,
        email: u.email,
        passwordHash: hash,
        firstName: u.first,
        lastName: u.last,
        role: u.role,
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`✅ ${u.role}: ${u.email} / Password@123`);
  }

  console.log('\n🎉 Seed completed!');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
