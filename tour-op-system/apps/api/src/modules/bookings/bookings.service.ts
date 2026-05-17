import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { ChangeBookingStatusDto } from './dto/change-status.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: QueryBookingDto) {
    const { search, tourId, supplierId, status, category, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { tour: { organizationId } };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tourId) where.tourId = tourId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { serviceDate: 'asc' },
        include: {
          tour: { select: { id: true, code: true, title: true, status: true } },
          supplier: { select: { id: true, name: true, category: true, phone: true } },
          items: true,
          _count: { select: { payments: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, organizationId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: { id, tour: { organizationId } },
      include: {
        tour: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            travelDateFrom: true,
            travelDateTo: true,
          },
        },
        supplier: true,
        items: { include: { resource: true } },
        payments: { orderBy: { createdAt: 'desc' } },
        inquiries: { orderBy: { sentAt: 'desc' } },
      },
    });
    if (!booking) throw new NotFoundException(`Booking ${id} not found`);
    return booking;
  }

  async create(organizationId: string, dto: CreateBookingDto) {
    const tour = await this.prisma.tour.findFirst({ where: { id: dto.tourId, organizationId } });
    if (!tour) throw new NotFoundException('Tour not found');

    const code = await this.generateCode(organizationId);
    const quantity = dto.quantity ?? 1;
    const unitCost = dto.unitCost ?? 0;
    const totalCost = quantity * unitCost;

    return this.prisma.booking.create({
      data: {
        tourId: dto.tourId,
        supplierId: dto.supplierId,
        code,
        category: dto.category,
        title: dto.title,
        status: BookingStatus.DRAFT,
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : undefined,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
        quantity,
        unitCost,
        totalCost,
        amountDue: totalCost,
        currency: dto.currency ?? 'VND',
        paymentDeadline: dto.paymentDeadline ? new Date(dto.paymentDeadline) : undefined,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                name: item.name,
                description: item.description,
                resourceId: item.resourceId,
                date: item.date ? new Date(item.date) : undefined,
                quantity: item.quantity ?? 1,
                unit: item.unit ?? 'per_person',
                unitCost: item.unitCost,
                totalCost: (item.quantity ?? 1) * item.unitCost,
                notes: item.notes,
              })),
            }
          : undefined,
      },
      include: { items: true, supplier: true },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateBookingDto) {
    const booking = await this.findOne(id, organizationId);
    if (booking.status === BookingStatus.CANCELLED)
      throw new BadRequestException('Không thể sửa booking đã huỷ');

    const { items, ...restDto } = dto;
    const quantity = dto.quantity ?? Number(booking.quantity);
    const unitCost = dto.unitCost ?? Number(booking.unitCost);
    const totalCost = quantity * unitCost;
    const amountPaid = Number(booking.amountPaid);
    const amountDue = Math.max(0, totalCost - amountPaid);

    return this.prisma.booking.update({
      where: { id },
      data: {
        ...restDto,
        quantity,
        unitCost,
        totalCost,
        amountDue: Math.max(0, amountDue),
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : undefined,
        checkIn: dto.checkIn ? new Date(dto.checkIn) : undefined,
        checkOut: dto.checkOut ? new Date(dto.checkOut) : undefined,
        paymentDeadline: dto.paymentDeadline ? new Date(dto.paymentDeadline) : undefined,
      },
    });
  }

  async changeStatus(id: string, organizationId: string, dto: ChangeBookingStatusDto) {
    const booking = await this.findOne(id, organizationId);
    const { status, confirmationNo } = dto;

    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      DRAFT: [BookingStatus.PENDING, BookingStatus.CANCELLED],
      PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      CONFIRMED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new BadRequestException(`Không thể chuyển từ ${booking.status} sang ${status}`);
    }

    const timestamps: any = {};
    if (status === BookingStatus.PENDING) timestamps.sentAt = new Date();
    if (status === BookingStatus.CONFIRMED) timestamps.confirmedAt = new Date();
    if (status === BookingStatus.CANCELLED) timestamps.cancelledAt = new Date();

    return this.prisma.booking.update({
      where: { id },
      data: { status, ...timestamps, ...(confirmationNo && { confirmationNo }) },
    });
  }

  async addPayment(
    id: string,
    organizationId: string,
    data: {
      amount: number;
      currency: string;
      method: string;
      reference?: string;
      notes?: string;
      dueDate?: string;
    },
  ) {
    const booking = await this.findOne(id, organizationId);

    const payment = await this.prisma.supplierPayment.create({
      data: {
        bookingId: id,
        supplierId: booking.supplierId || undefined,
        amount: data.amount,
        currency: data.currency as any,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        paidAt: new Date(),
      },
    });

    const totalPaid = Number(booking.amountPaid) + data.amount;
    const totalCost = Number(booking.totalCost);
    const amountDue = Math.max(0, totalCost - totalPaid);
    const paymentStatus = amountDue === 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';

    await this.prisma.booking.update({
      where: { id },
      data: { amountPaid: totalPaid, amountDue, paymentStatus: paymentStatus as any },
    });

    return payment;
  }

  async getStats(organizationId: string) {
    const [total, byStatus, unpaidAmount] = await Promise.all([
      this.prisma.booking.count({ where: { tour: { organizationId } } }),
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { tour: { organizationId } },
        _count: true,
      }),
      this.prisma.booking.aggregate({
        where: { tour: { organizationId }, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
        _sum: { amountDue: true },
      }),
    ]);

    return {
      total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      totalUnpaid: Number(unpaidAmount._sum.amountDue ?? 0),
    };
  }

  private async generateCode(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.booking.count({ where: { tour: { organizationId } } });
    return `BOK-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
