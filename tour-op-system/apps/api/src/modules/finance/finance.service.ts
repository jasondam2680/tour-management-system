import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentStatus, InvoiceType } from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { AddReceiptDto } from './dto/add-receipt.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getOverview(organizationId: string) {
    const now = new Date();

    const [arTotal, arPaid, arUnpaid, arOverdue, apTotal, apPaid, apUnpaid,
           recentInvoices, overdueInvoices, monthlyAR] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { tour: { organizationId }, type: InvoiceType.RECEIVABLE },
        _sum: { totalAmount: true, amountPaid: true, amountDue: true }, _count: true,
      }),
      this.prisma.invoice.count({ where: { tour: { organizationId }, type: InvoiceType.RECEIVABLE, status: PaymentStatus.PAID } }),
      this.prisma.invoice.count({ where: { tour: { organizationId }, type: InvoiceType.RECEIVABLE, status: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] } } }),
      this.prisma.invoice.count({ where: { tour: { organizationId }, type: InvoiceType.RECEIVABLE, status: { not: PaymentStatus.PAID }, dueDate: { lt: now } } }),
      this.prisma.booking.aggregate({ where: { tour: { organizationId } }, _sum: { totalCost: true, amountPaid: true, amountDue: true }, _count: true }),
      this.prisma.booking.count({ where: { tour: { organizationId }, paymentStatus: PaymentStatus.PAID } }),
      this.prisma.booking.count({ where: { tour: { organizationId }, paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] } } }),
      this.prisma.invoice.findMany({
        where: { tour: { organizationId } }, orderBy: { createdAt: 'desc' }, take: 5,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
          tour: { select: { id: true, code: true, title: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: { tour: { organizationId }, status: { not: PaymentStatus.PAID }, dueDate: { lt: now } },
        orderBy: { dueDate: 'asc' }, take: 5,
        include: { customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } } },
      }),
      this.prisma.$queryRaw<{ month: string; revenue: number; collected: number }[]>`
        SELECT TO_CHAR(i."issuedAt", 'YYYY-MM') AS month,
               SUM(i."totalAmount")::float AS revenue,
               SUM(i."amountPaid")::float AS collected
        FROM invoices i
        JOIN tours t ON t.id = i."tourId"
        WHERE t."organizationId" = ${organizationId}
          AND i.type = 'RECEIVABLE'
          AND i."issuedAt" >= NOW() - INTERVAL '6 months'
        GROUP BY month ORDER BY month ASC
      `,
    ]);

    return {
      ar: {
        totalAmount: Number(arTotal._sum.totalAmount ?? 0), totalPaid: Number(arTotal._sum.amountPaid ?? 0),
        totalDue: Number(arTotal._sum.amountDue ?? 0), countTotal: arTotal._count,
        countPaid: arPaid, countUnpaid: arUnpaid, countOverdue: arOverdue,
      },
      ap: {
        totalCost: Number(apTotal._sum.totalCost ?? 0), totalPaid: Number(apTotal._sum.amountPaid ?? 0),
        totalDue: Number(apTotal._sum.amountDue ?? 0), countTotal: apTotal._count,
        countPaid: apPaid, countUnpaid: apUnpaid,
      },
      recentInvoices, overdueInvoices, monthlyAR,
    };
  }

  async findAllInvoices(organizationId: string, query: QueryInvoiceDto) {
    const { search, type, status, currency, customerId, tourId, overdue, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const now  = new Date();
    const where: any = { tour: { organizationId } };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { customer: { firstName:   { contains: search, mode: 'insensitive' } } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (type)       where.type       = type;
    if (status)     where.status     = status;
    if (currency)   where.currency   = currency;
    if (customerId) where.customerId = customerId;
    if (tourId)     where.tourId     = tourId;
    if (overdue === 'true') { where.status = { not: PaymentStatus.PAID }; where.dueDate = { lt: now }; }
    if (dateFrom || dateTo) {
      where.issuedAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo   && { lte: new Date(dateTo)   }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
          tour:     { select: { id: true, code: true, title: true } },
          receipts: { select: { id: true, amount: true, method: true, receivedAt: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOneInvoice(id: string, organizationId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tour: { organizationId } },
      include: {
        customer: true,
        tour:     { select: { id: true, code: true, title: true, travelDateFrom: true, travelDateTo: true } },
        receipts: { orderBy: { receivedAt: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async createInvoice(organizationId: string, dto: CreateInvoiceDto) {
    if (dto.tourId) {
      const tour = await this.prisma.tour.findFirst({ where: { id: dto.tourId, organizationId } });
      if (!tour) throw new NotFoundException('Tour not found');
    }

    const code      = await this.generateInvoiceCode(organizationId);
    const subtotal  = dto.subtotal ?? 0;
    const taxPct    = dto.taxPct   ?? 0;
    const taxAmount = subtotal * (taxPct / 100);
    const total     = subtotal + taxAmount;

    return this.prisma.invoice.create({
      data: {
        code, type: dto.type, customerId: dto.customerId, tourId: dto.tourId,
        status: PaymentStatus.UNPAID, subtotal, taxPct, taxAmount,
        totalAmount: total, amountPaid: 0, amountDue: total,
        currency: dto.currency ?? 'USD',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes:   dto.notes,
      },
      include: {
        customer: true,
        tour: { select: { id: true, code: true, title: true } },
      },
    });
  }

  async addReceipt(invoiceId: string, organizationId: string, dto: AddReceiptDto) {
    const invoice = await this.findOneInvoice(invoiceId, organizationId);
    if (invoice.status === PaymentStatus.PAID) throw new BadRequestException('Invoice đã thanh toán đủ');

    const exchangeRate = dto.exchangeRate ?? 1;
    const amountBase   = dto.amount * exchangeRate;

    await this.prisma.receipt.create({
      data: {
        invoiceId, amount: dto.amount, currency: dto.currency,
        exchangeRate, amountBase, method: dto.method,
        reference: dto.reference, notes: dto.notes, receivedAt: new Date(),
      },
    });

    const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
    const newAmountDue  = Math.max(0, Number(invoice.totalAmount) - newAmountPaid);
    const newStatus: PaymentStatus =
      newAmountDue === 0    ? PaymentStatus.PAID
      : newAmountPaid > 0  ? PaymentStatus.PARTIAL
      :                       PaymentStatus.UNPAID;

    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data:  { amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus },
      include: { receipts: true },
    });
  }

  async getApSummary(organizationId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: { tour: { organizationId }, paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] } },
        skip, take: limit, orderBy: { paymentDeadline: 'asc' },
        include: {
          tour:     { select: { id: true, code: true, title: true } },
          supplier: { select: { id: true, name: true, category: true, phone: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.booking.count({
        where: { tour: { organizationId }, paymentStatus: { in: [PaymentStatus.UNPAID, PaymentStatus.PARTIAL] } },
      }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  private async generateInvoiceCode(organizationId: string): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await this.prisma.invoice.count({ where: { tour: { organizationId } } });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
