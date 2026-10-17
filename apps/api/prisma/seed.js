const { PrismaClient, Currency, UserRole, UserStatus, CustomerType, SupplierCategory, TourStatus, BookingStatus } = require('@prisma/client');
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
  const seededSupplierIds = [hotelCaravelle.id, hotelHoian.id, transportMai.id, restaurantNgon.id, guideCompany.id, attractionCuchi.id];
  const seededResources = await prisma.resource.findMany({
    where: { supplierId: { in: seededSupplierIds } },
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { bookingItems: true, quotationItems: true } } },
  });
  const resourcesByKey = new Map();
  const duplicateResourceIds = [];
  for (const resource of seededResources) {
    const key = `${resource.supplierId}:${resource.name}`;
    const group = resourcesByKey.get(key) || [];
    group.push(resource);
    resourcesByKey.set(key, group);
  }
  for (const group of resourcesByKey.values()) {
    if (group.length < 2) continue;
    const keep = group.find((resource) => resource._count.bookingItems || resource._count.quotationItems) || group[0];
    group.forEach((resource) => {
      if (resource.id !== keep.id && !resource._count.bookingItems && !resource._count.quotationItems) duplicateResourceIds.push(resource.id);
    });
  }
  if (duplicateResourceIds.length) {
    await prisma.resource.deleteMany({ where: { id: { in: duplicateResourceIds } } });
  }
  console.log(`✅ Resources (${seededResources.length - duplicateResourceIds.length})`);

  // 6. REVIEW OPERATIONS DATA
  const tourStart = new Date();
  tourStart.setDate(tourStart.getDate() + 5);
  tourStart.setHours(0, 0, 0, 0);
  const tourEnd = new Date(tourStart);
  tourEnd.setDate(tourEnd.getDate() + 3);

  const demoTour = await prisma.tour.upsert({
    where: { code: 'TOUR-DEMO-001' },
    update: {
      organizationId: org.id,
      customerId: customers[3].id,
      title: 'Hồ Chí Minh – Hội An: Demo Operations Tour',
      status: TourStatus.CONFIRMED,
      pax: 12,
      paxAdult: 10,
      paxChild: 2,
      travelDateFrom: tourStart,
      travelDateTo: tourEnd,
      destination: 'Ho Chi Minh City · Hoi An',
      pickupLocation: 'Tân Sơn Nhất Airport',
      pickupTime: '08:00',
      currency: Currency.USD,
    },
    create: {
      organizationId: org.id,
      customerId: customers[3].id,
      code: 'TOUR-DEMO-001',
      title: 'Hồ Chí Minh – Hội An: Demo Operations Tour',
      status: TourStatus.CONFIRMED,
      pax: 12,
      paxAdult: 10,
      paxChild: 2,
      travelDateFrom: tourStart,
      travelDateTo: tourEnd,
      destination: 'Ho Chi Minh City · Hoi An',
      pickupLocation: 'Tân Sơn Nhất Airport',
      pickupTime: '08:00',
      sellingPrice: 6800,
      totalCost: 4200,
      profitAmount: 2600,
      profitMargin: 38.24,
      currency: Currency.USD,
      confirmedAt: new Date(),
    },
  });

  const demoBookingData = [
    {
      code: 'BOK-DEMO-HOTEL', supplierId: hotelCaravelle.id, category: SupplierCategory.HOTEL,
      status: BookingStatus.DRAFT, title: 'Phòng Superior – Demo Operations Tour', quantity: 6,
      unitCost: 150, totalCost: 900, currency: Currency.USD, resourceName: 'Phòng Superior',
    },
    {
      code: 'BOK-DEMO-TRANSFER', supplierId: transportMai.id, category: SupplierCategory.TRANSPORT,
      status: BookingStatus.CONFIRMED, title: 'Xe 16 chỗ – Đón sân bay', quantity: 1,
      unitCost: 1800000, totalCost: 1800000, currency: Currency.VND, confirmationNo: 'ML-REV-001', resourceName: 'Xe 16 chỗ',
    },
    {
      code: 'BOK-DEMO-GUIDE', supplierId: guideCompany.id, category: SupplierCategory.GUIDE,
      status: BookingStatus.PENDING, title: 'HDV tiếng Anh – 4 ngày', quantity: 4,
      unitCost: 80, totalCost: 320, currency: Currency.USD, resourceName: 'HDV tiếng Anh',
    },
  ];

  let guideBookingId;
  for (const data of demoBookingData) {
    const booking = await prisma.booking.upsert({
      where: { code: data.code },
      update: {
        tourId: demoTour.id,
        supplierId: data.supplierId,
        category: data.category,
        status: data.status,
        title: data.title,
        serviceDate: tourStart,
        checkIn: data.category === SupplierCategory.HOTEL ? tourStart : undefined,
        checkOut: data.category === SupplierCategory.HOTEL ? tourEnd : undefined,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.totalCost,
        amountDue: data.totalCost,
        paymentStatus: 'UNPAID',
        currency: data.currency,
        confirmationNo: data.confirmationNo,
        paymentDeadline: new Date(tourStart.getTime() - 86400000 * 2),
      },
      create: {
        tourId: demoTour.id,
        supplierId: data.supplierId,
        code: data.code,
        category: data.category,
        status: data.status,
        title: data.title,
        serviceDate: tourStart,
        checkIn: data.category === SupplierCategory.HOTEL ? tourStart : undefined,
        checkOut: data.category === SupplierCategory.HOTEL ? tourEnd : undefined,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.totalCost,
        amountDue: data.totalCost,
        paymentStatus: 'UNPAID',
        currency: data.currency,
        confirmationNo: data.confirmationNo,
        paymentDeadline: new Date(tourStart.getTime() - 86400000 * 2),
      },
    });

    if (data.code === 'BOK-DEMO-GUIDE') guideBookingId = booking.id;

    const resource = await prisma.resource.findFirst({ where: { supplierId: data.supplierId, name: data.resourceName } });
    if (resource) {
      await prisma.bookingItem.upsert({
        where: { id: `seed-item-${data.code}` },
        update: { bookingId: booking.id, resourceId: resource.id, name: resource.name, quantity: data.quantity, unit: resource.unit, unitCost: data.unitCost, totalCost: data.totalCost },
        create: { id: `seed-item-${data.code}`, bookingId: booking.id, resourceId: resource.id, name: resource.name, quantity: data.quantity, unit: resource.unit, unitCost: data.unitCost, totalCost: data.totalCost },
      });
    }
  }

  if (guideBookingId) {
    await prisma.priceInquiry.upsert({
      where: { id: 'seed-inquiry-guide' },
      update: { tourId: demoTour.id, bookingId: guideBookingId, supplierId: guideCompany.id, subject: 'Xác nhận HDV tiếng Anh – Demo Operations Tour', content: 'Vui lòng xác nhận HDV tiếng Anh cho 4 ngày và gửi thông tin liên hệ.', quotedPrice: 320, currency: Currency.USD, notes: 'Tạo sẵn để kiểm thử lịch sử hỏi giá.' },
      create: { id: 'seed-inquiry-guide', tourId: demoTour.id, bookingId: guideBookingId, supplierId: guideCompany.id, subject: 'Xác nhận HDV tiếng Anh – Demo Operations Tour', content: 'Vui lòng xác nhận HDV tiếng Anh cho 4 ngày và gửi thông tin liên hệ.', quotedPrice: 320, currency: Currency.USD, notes: 'Tạo sẵn để kiểm thử lịch sử hỏi giá.' },
    });
  }
  console.log('✅ Review operations data (1 tour, 3 bookings)');

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
