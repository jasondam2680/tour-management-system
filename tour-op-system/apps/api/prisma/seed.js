const { PrismaClient, Currency, UserRole, CustomerType, SupplierCategory } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function main() {
  const connectionString = process.env.DATABASE_URL
    || 'postgresql://tour_op_user:tour_op_pass_2024@localhost:5432/tour_op_db';
  const pool    = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma  = new PrismaClient({ adapter });

  console.log('🌱 Seeding database...');

  // 1. ORGANIZATION
  const org = await prisma.organization.upsert({
    where:  { code: 'DEMO_OP' },
    update: {},
    create: {
      name: 'Demo Tour Operator', code: 'DEMO_OP',
      email: 'info@demotourop.com', phone: '+84901234567',
      address: '123 Nguyen Hue, District 1, HCMC',
      country: 'VN', currency: Currency.VND,
    },
  });
  console.log('✅ Organization:', org.name);

  // 2. USERS
  const adminHash = await bcrypt.hash('Admin@123456', 12);
  await prisma.user.upsert({
    where: { email: 'admin@demotourop.com' },
    update: {
      organizationId: org.id,
      passwordHash: adminHash,
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.SUPER_ADMIN,
      status: 'ACTIVE',
    },
    create: {
      organizationId: org.id, email: 'admin@demotourop.com',
      passwordHash: adminHash, firstName: 'Admin', lastName: 'System',
      role: UserRole.SUPER_ADMIN, status: 'ACTIVE',
    },
  });

  for (const u of [
    { email: 'sales@demotourop.com',   name: ['Minh', 'Nguyen'],  role: UserRole.SALES   },
    { email: 'op@demotourop.com',      name: ['Lan', 'Tran'],     role: UserRole.OP      },
    { email: 'finance@demotourop.com', name: ['Hung', 'Le'],      role: UserRole.FINANCE },
    { email: 'guide@demotourop.com',   name: ['Tuan', 'Pham'],    role: UserRole.GUIDE   },
  ]) {
    const hash = await bcrypt.hash('Password@123', 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        organizationId: org.id,
        passwordHash: hash,
        firstName: u.name[0],
        lastName: u.name[1],
        role: u.role,
        status: 'ACTIVE',
      },
      create: {
        organizationId: org.id,
        email: u.email,
        passwordHash: hash,
        firstName: u.name[0],
        lastName: u.name[1],
        role: u.role,
        status: 'ACTIVE',
      },
    });
  }
  console.log('✅ Users (5)');

  // 3. CUSTOMERS
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { code: 'CUS-B2B-001' }, update: {},
      create: {
        organizationId: org.id, code: 'CUS-B2B-001', type: CustomerType.B2B,
        companyName: 'Hana Travel Agency', contactPerson: 'Ms. Hana Nguyen',
        email: 'hana@hanatravel.vn', phone: '+84901111001',
        city: 'Ho Chi Minh City', country: 'Vietnam',
        currency: Currency.USD, isVip: true, isActive: true, tags: ['vip', 'b2b', 'agency'],
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUS-B2B-002' }, update: {},
      create: {
        organizationId: org.id, code: 'CUS-B2B-002', type: CustomerType.B2B,
        companyName: 'Asia Pacific Tours', contactPerson: 'Mr. David Chen',
        email: 'david@asiapacifictours.com', phone: '+65901222002',
        city: 'Singapore', country: 'Singapore',
        currency: Currency.USD, isVip: false, isActive: true, tags: ['singapore', 'b2b'],
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUS-B2B-003' }, update: {},
      create: {
        organizationId: org.id, code: 'CUS-B2B-003', type: CustomerType.B2B,
        companyName: 'Japan Inbound Co., Ltd', contactPerson: 'Tanaka-san',
        email: 'tanaka@japaninbound.co.jp', phone: '+81901333003',
        city: 'Tokyo', country: 'Japan',
        currency: Currency.USD, isVip: true, isActive: true, tags: ['japan', 'vip', 'b2b'],
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUS-B2C-001' }, update: {},
      create: {
        organizationId: org.id, code: 'CUS-B2C-001', type: CustomerType.B2C,
        firstName: 'John', lastName: 'Smith',
        email: 'john.smith@gmail.com', phone: '+1901444001',
        city: 'New York', country: 'USA',
        currency: Currency.USD, isVip: false, isActive: true, tags: ['usa', 'individual'],
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUS-B2C-002' }, update: {},
      create: {
        organizationId: org.id, code: 'CUS-B2C-002', type: CustomerType.B2C,
        firstName: 'Sophie', lastName: 'Martin',
        email: 'sophie.martin@gmail.com', phone: '+33901555002',
        city: 'Paris', country: 'France',
        currency: Currency.EUR, isVip: false, isActive: true, tags: ['france', 'individual'],
      },
    }),
  ]);
  console.log(`✅ Customers (${customers.length})`);

  // 4. SUPPLIERS
  const hotelCaravelle = await prisma.supplier.upsert({
    where: { code: 'HOT-2024-0001' }, update: {},
    create: {
      organizationId: org.id, code: 'HOT-2024-0001', category: SupplierCategory.HOTEL,
      name: 'Caravelle Saigon Hotel', contactPerson: 'Ms. Linh Pham',
      email: 'linh.pham@caravellehotel.com', phone: '+84281234567',
      address: '19-23 Lam Son Square, District 1', city: 'Ho Chi Minh City', country: 'Vietnam',
      currency: Currency.USD, rating: 5, isPreferred: true, isActive: true,
      paymentTerms: 'Net 30', tags: ['5-star', 'central', 'luxury'],
    },
  });

  const hotelHoian = await prisma.supplier.upsert({
    where: { code: 'HOT-2024-0002' }, update: {},
    create: {
      organizationId: org.id, code: 'HOT-2024-0002', category: SupplierCategory.HOTEL,
      name: 'Anantara Hoi An Resort', contactPerson: 'Mr. Nam Tran',
      email: 'nam.tran@anantara.com', phone: '+84235912345',
      city: 'Hoi An', country: 'Vietnam',
      currency: Currency.USD, rating: 5, isPreferred: true, isActive: true,
      paymentTerms: 'Net 14', tags: ['5-star', 'resort', 'hoian'],
    },
  });

  const transportMai = await prisma.supplier.upsert({
    where: { code: 'TRA-2024-0001' }, update: {},
    create: {
      organizationId: org.id, code: 'TRA-2024-0001', category: SupplierCategory.TRANSPORT,
      name: 'Mai Linh Express', contactPerson: 'Anh Duc',
      email: 'duc@mailinh.vn', phone: '+84901777001',
      city: 'Ho Chi Minh City', country: 'Vietnam',
      currency: Currency.VND, rating: 4, isPreferred: true, isActive: true,
      paymentTerms: 'Trả trước 50%', tags: ['transport', 'reliable'],
    },
  });

  const restaurantNgon = await prisma.supplier.upsert({
    where: { code: 'RES-2024-0001' }, update: {},
    create: {
      organizationId: org.id, code: 'RES-2024-0001', category: SupplierCategory.RESTAURANT,
      name: 'Nhà Hàng Ngon', contactPerson: 'Ms. Hoa',
      email: 'hoa@nhahangngon.vn', phone: '+84281234001',
      address: '160 Pasteur, District 3', city: 'Ho Chi Minh City', country: 'Vietnam',
      currency: Currency.VND, rating: 4, isPreferred: false, isActive: true,
      paymentTerms: 'Thanh toán ngay', tags: ['vietnamese', 'group-friendly'],
    },
  });

  const guideCompany = await prisma.supplier.upsert({
    where: { code: 'GUI-2024-0001' }, update: {},
    create: {
      organizationId: org.id, code: 'GUI-2024-0001', category: SupplierCategory.GUIDE,
      name: 'Vietnam Expert Guides', contactPerson: 'Mr. Thanh Nguyen',
      email: 'thanh@vietnamguides.vn', phone: '+84901888001',
      city: 'Ho Chi Minh City', country: 'Vietnam',
      currency: Currency.USD, rating: 5, isPreferred: true, isActive: true,
      paymentTerms: 'Net 7', tags: ['guide', 'multilingual'],
    },
  });

  const attractionCuchi = await prisma.supplier.upsert({
    where: { code: 'ATT-2024-0001' }, update: {},
    create: {
      organizationId: org.id, code: 'ATT-2024-0001', category: SupplierCategory.ATTRACTION,
      name: 'Cu Chi Tunnels - Vietnam Tourism', contactPerson: 'Ms. Thanh',
      email: 'cuchi@vietnamtourism.vn', phone: '+84281999001',
      city: 'Ho Chi Minh City', country: 'Vietnam',
      currency: Currency.USD, rating: 4, isPreferred: false, isActive: true,
      tags: ['attraction', 'historical'],
    },
  });
  console.log('✅ Suppliers (6)');

  // 5. RESOURCES
  await prisma.resource.createMany({
    skipDuplicates: true,
    data: [
      { supplierId: hotelCaravelle.id, category: SupplierCategory.HOTEL, name: 'Phòng Superior',      basePrice: 150,       currency: Currency.USD, unit: 'per_room',   isActive: true },
      { supplierId: hotelCaravelle.id, category: SupplierCategory.HOTEL, name: 'Phòng Deluxe',        basePrice: 200,       currency: Currency.USD, unit: 'per_room',   isActive: true },
      { supplierId: hotelCaravelle.id, category: SupplierCategory.HOTEL, name: 'Phòng Suite',         basePrice: 350,       currency: Currency.USD, unit: 'per_room',   isActive: true },
      { supplierId: hotelCaravelle.id, category: SupplierCategory.HOTEL, name: 'Extra Bed',           basePrice: 30,        currency: Currency.USD, unit: 'per_bed',    isActive: true },
      { supplierId: hotelCaravelle.id, category: SupplierCategory.HOTEL, name: 'Nhà hàng - Set menu', basePrice: 45,        currency: Currency.USD, unit: 'per_person', isActive: true },
      { supplierId: hotelHoian.id,     category: SupplierCategory.HOTEL, name: 'Garden View Room',   basePrice: 180,       currency: Currency.USD, unit: 'per_room',   isActive: true },
      { supplierId: hotelHoian.id,     category: SupplierCategory.HOTEL, name: 'River View Room',    basePrice: 220,       currency: Currency.USD, unit: 'per_room',   isActive: true },
      { supplierId: hotelHoian.id,     category: SupplierCategory.HOTEL, name: 'Pool Villa',         basePrice: 450,       currency: Currency.USD, unit: 'per_room',   isActive: true },
      { supplierId: hotelHoian.id,     category: SupplierCategory.HOTEL, name: 'Extra Bed',          basePrice: 35,        currency: Currency.USD, unit: 'per_bed',    isActive: true },
      { supplierId: transportMai.id,   category: SupplierCategory.TRANSPORT, name: 'Xe 4 chỗ',       basePrice: 800_000,   currency: Currency.VND, unit: 'per_trip',   isActive: true, capacity: 4  },
      { supplierId: transportMai.id,   category: SupplierCategory.TRANSPORT, name: 'Xe 7 chỗ',       basePrice: 1_200_000, currency: Currency.VND, unit: 'per_trip',   isActive: true, capacity: 7  },
      { supplierId: transportMai.id,   category: SupplierCategory.TRANSPORT, name: 'Xe 16 chỗ',      basePrice: 1_800_000, currency: Currency.VND, unit: 'per_trip',   isActive: true, capacity: 16 },
      { supplierId: transportMai.id,   category: SupplierCategory.TRANSPORT, name: 'Xe 29 chỗ',      basePrice: 2_500_000, currency: Currency.VND, unit: 'per_trip',   isActive: true, capacity: 29 },
      { supplierId: transportMai.id,   category: SupplierCategory.TRANSPORT, name: 'Xe 45 chỗ',      basePrice: 3_500_000, currency: Currency.VND, unit: 'per_trip',   isActive: true, capacity: 45 },
      { supplierId: restaurantNgon.id, category: SupplierCategory.RESTAURANT, name: 'Set menu A',    basePrice: 250_000,   currency: Currency.VND, unit: 'per_person', isActive: true },
      { supplierId: restaurantNgon.id, category: SupplierCategory.RESTAURANT, name: 'Set menu B',    basePrice: 350_000,   currency: Currency.VND, unit: 'per_person', isActive: true },
      { supplierId: restaurantNgon.id, category: SupplierCategory.RESTAURANT, name: 'Set menu trẻ em', basePrice: 150_000, currency: Currency.VND, unit: 'per_person', isActive: true },
      { supplierId: restaurantNgon.id, category: SupplierCategory.RESTAURANT, name: 'Buffet',        basePrice: 300_000,   currency: Currency.VND, unit: 'per_person', isActive: true },
      { supplierId: guideCompany.id,   category: SupplierCategory.GUIDE, name: 'HDV tiếng Anh',      basePrice: 80,        currency: Currency.USD, unit: 'per_day',    isActive: true },
      { supplierId: guideCompany.id,   category: SupplierCategory.GUIDE, name: 'HDV tiếng Nhật',     basePrice: 100,       currency: Currency.USD, unit: 'per_day',    isActive: true },
      { supplierId: guideCompany.id,   category: SupplierCategory.GUIDE, name: 'HDV tiếng Hàn',      basePrice: 100,       currency: Currency.USD, unit: 'per_day',    isActive: true },
      { supplierId: guideCompany.id,   category: SupplierCategory.GUIDE, name: 'HDV tiếng Trung',    basePrice: 90,        currency: Currency.USD, unit: 'per_day',    isActive: true },
      { supplierId: attractionCuchi.id, category: SupplierCategory.ATTRACTION, name: 'Vé người lớn', basePrice: 10,        currency: Currency.USD, unit: 'per_person', isActive: true },
      { supplierId: attractionCuchi.id, category: SupplierCategory.ATTRACTION, name: 'Vé trẻ em',    basePrice: 5,         currency: Currency.USD, unit: 'per_person', isActive: true },
    ],
  });
  console.log('✅ Resources (24)');

  console.log('\n🎉 Seed hoàn tất!');
  console.log('─────────────────────────────────────────────');
  console.log('🔐 Tài khoản đăng nhập:');
  console.log('   Admin   : admin@demotourop.com   / Admin@123456');
  console.log('   Sales   : sales@demotourop.com   / Password@123');
  console.log('   OP      : op@demotourop.com      / Password@123');
  console.log('   Finance : finance@demotourop.com / Password@123');
  console.log('   Guide   : guide@demotourop.com   / Password@123');
  console.log('─────────────────────────────────────────────');
  console.log('👥 Customers: 5 (3 B2B + 2 B2C)');
  console.log('🏢 Suppliers: 6 | 🛎️ Resources: 24');
  await prisma.$disconnect();
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); });
