import {
  Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { QuotationItemDto } from './dto/quotation-item.dto';
import { QuotationStatus } from '@prisma/client';

// Status transitions for quotations
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT:       ['SENT', 'REJECTED'],
  SENT:        ['VIEWED', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  VIEWED:      ['NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  NEGOTIATING: ['APPROVED', 'REJECTED', 'EXPIRED', 'DRAFT'],
  APPROVED:    ['CONVERTED'],
  REJECTED:    ['DRAFT'],
  EXPIRED:     ['DRAFT'],
  CONVERTED:   [],
};

interface Totals {
  subtotal:      number;
  totalCost:     number;
  discountAmt:   number;
  taxAmount:     number;
  totalAmount:   number;
  profitAmount:  number;
  profitMargin:  number;
}

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  // ── Core calculation engine ──────────────────────────────────
  private calcTotals(
    items: QuotationItemDto[],
    discountAmount = 0,
    discountPct    = 0,
    taxPct         = 0,
  ): Totals {
    let subtotal  = 0;
    let totalCost = 0;

    for (const item of items) {
      if (!item.isIncluded && item.isIncluded !== undefined) continue;
      const qty        = item.quantity ?? 1;
      const selling    = (item.sellingPrice ?? 0) * qty;
      const cost       = (item.buyingPrice  ?? 0) * qty;
      subtotal  += selling;
      totalCost += cost;
    }

    // Apply discount
    const discountAmt = discountAmount > 0
      ? discountAmount
      : (subtotal * discountPct) / 100;

    const afterDiscount = subtotal - discountAmt;
    const taxAmount     = (afterDiscount * taxPct) / 100;
    const totalAmount   = afterDiscount + taxAmount;
    const profitAmount  = totalAmount - totalCost;
    const profitMargin  = totalAmount > 0 ? (profitAmount / totalAmount) * 100 : 0;

    return {
      subtotal:     Math.round(subtotal * 100) / 100,
      totalCost:    Math.round(totalCost * 100) / 100,
      discountAmt:  Math.round(discountAmt * 100) / 100,
      taxAmount:    Math.round(taxAmount * 100) / 100,
      totalAmount:  Math.round(totalAmount * 100) / 100,
      profitAmount: Math.round(profitAmount * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
    };
  }

  // ── Auto-generate quotation code ─────────────────────────────
  private async generateCode(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.prisma.quotation.findFirst({
      where: { organizationId, code: { startsWith: `QUO-${year}` } },
      orderBy: { code: 'desc' },
    });
    let seq = 1;
    if (last?.code) {
      seq = parseInt(last.code.split('-').pop()!, 10) + 1;
    }
    return `QUO-${year}-${String(seq).padStart(4, '0')}`;
  }

  // ── CREATE ───────────────────────────────────────────────────
  async create(dto: CreateQuotationDto, organizationId: string, createdById: string) {
    const code = await this.generateCode(organizationId);
    const items = dto.items ?? [];
    const totals = this.calcTotals(items, dto.discountAmount, dto.discountPct, dto.taxPct);

    // Build item data with per-item totals and markup
    const itemsData = items.map((item, idx) => {
      const qty         = item.quantity ?? 1;
      const totalSell   = (item.sellingPrice ?? 0) * qty;
      const totalCost   = (item.buyingPrice ?? 0) * qty;
      const markup      = item.buyingPrice > 0
        ? ((item.sellingPrice - item.buyingPrice) / item.buyingPrice) * 100
        : 0;

      return {
        day:          item.day,
        sortOrder:    item.sortOrder ?? idx,
        category:     item.category,
        name:         item.name,
        description:  item.description,
        resourceId:   item.resourceId,
        quantity:     qty,
        unit:         item.unit ?? 'per_person',
        sellingPrice: item.sellingPrice,
        buyingPrice:  item.buyingPrice,
        markup:       Math.round(markup * 100) / 100,
        totalSelling: totalSell,
        totalCost,
        currency:     item.currency ?? dto.currency ?? 'USD',
        date:         item.date ? new Date(item.date) : undefined,
        startTime:    item.startTime,
        endTime:      item.endTime,
        notes:        item.notes,
        isOptional:   item.isOptional ?? false,
        isIncluded:   item.isIncluded ?? true,
      };
    });

    return this.prisma.quotation.create({
      data: {
        organizationId,
        createdById,
        code,
        title:         dto.title,
        customerId:    dto.customerId,
        leadId:        dto.leadId,
        pax:           dto.pax,
        paxAdult:      dto.paxAdult ?? dto.pax,
        paxChild:      dto.paxChild ?? 0,
        travelDateFrom: dto.travelDateFrom ? new Date(dto.travelDateFrom) : undefined,
        travelDateTo:   dto.travelDateTo   ? new Date(dto.travelDateTo)   : undefined,
        duration:       dto.duration,
        destination:    dto.destination,
        tourType:       dto.tourType,
        subtotal:       totals.subtotal,
        discountAmount: totals.discountAmt,
        discountPct:    dto.discountPct ?? 0,
        taxAmount:      totals.taxAmount,
        taxPct:         dto.taxPct ?? 0,
        totalAmount:    totals.totalAmount,
        totalCost:      totals.totalCost,
        profitAmount:   totals.profitAmount,
        profitMargin:   totals.profitMargin,
        currency:       dto.currency ?? 'USD',
        validUntil:     dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes:          dto.notes,
        internalNotes:  dto.internalNotes,
        status:         'DRAFT',
        items:          { create: itemsData },
      },
      include: {
        items:     { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer:  { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  // ── LIST ─────────────────────────────────────────────────────
  async findAll(query: QueryQuotationDto, organizationId: string) {
    const {
      search, status, customerId, leadId,
      page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const where: any = {
      organizationId,
      ...(status     && { status }),
      ...(customerId && { customerId }),
      ...(leadId     && { leadId }),
      ...(search && {
        OR: [
          { title:       { contains: search, mode: 'insensitive' } },
          { code:        { contains: search, mode: 'insensitive' } },
          { destination: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.paginate(
      this.prisma.quotation,
      {
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer:  { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count:    { select: { items: true } },
        },
      },
      page,
      limit,
    );
  }

  // ── GET ONE ──────────────────────────────────────────────────
  async findOne(id: string, organizationId: string) {
    const q = await this.prisma.quotation.findFirst({
      where: { id, organizationId },
      include: {
        items:     { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer:  true,
        lead:      { select: { id: true, title: true, status: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        itineraryVersion: { include: { days: { include: { activities: true }, orderBy: { dayNumber: 'asc' } } } },
      },
    });
    if (!q) throw new NotFoundException(`Quotation ${id} not found`);
    return q;
  }

  // ── UPDATE ───────────────────────────────────────────────────
  async update(id: string, dto: UpdateQuotationDto, organizationId: string) {
    const existing = await this.prisma.quotation.findFirst({
      where: { id, organizationId },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException(`Quotation ${id} not found`);

    if (!['DRAFT', 'NEGOTIATING'].includes(existing.status as string)) {
      throw new BadRequestException(
        `Cannot edit quotation in status: ${existing.status}. Only DRAFT and NEGOTIATING allowed.`,
      );
    }

    const items = dto.items ?? (existing.items as unknown as QuotationItemDto[]);
    const totals = this.calcTotals(
      items,
      dto.discountAmount ?? Number(existing.discountAmount),
      dto.discountPct    ?? Number(existing.discountPct),
      dto.taxPct         ?? Number(existing.taxPct),
    );

    // Recalculate items if provided
    if (dto.items) {
      await this.prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    }

    const updateData: any = {
      ...(dto.title         && { title: dto.title }),
      ...(dto.pax           && { pax: dto.pax }),
      ...(dto.paxAdult      && { paxAdult: dto.paxAdult }),
      ...(dto.paxChild !== undefined && { paxChild: dto.paxChild }),
      ...(dto.travelDateFrom && { travelDateFrom: new Date(dto.travelDateFrom) }),
      ...(dto.travelDateTo   && { travelDateTo:   new Date(dto.travelDateTo) }),
      ...(dto.duration       && { duration: dto.duration }),
      ...(dto.destination    && { destination: dto.destination }),
      ...(dto.tourType       && { tourType: dto.tourType }),
      ...(dto.currency       && { currency: dto.currency }),
      ...(dto.notes          && { notes: dto.notes }),
      ...(dto.internalNotes  && { internalNotes: dto.internalNotes }),
      ...(dto.validUntil     && { validUntil: new Date(dto.validUntil) }),
      ...(dto.rejectedReason && { rejectedReason: dto.rejectedReason }),
      subtotal:       totals.subtotal,
      discountAmount: totals.discountAmt,
      discountPct:    dto.discountPct    ?? existing.discountPct,
      taxAmount:      totals.taxAmount,
      taxPct:         dto.taxPct         ?? existing.taxPct,
      totalAmount:    totals.totalAmount,
      totalCost:      totals.totalCost,
      profitAmount:   totals.profitAmount,
      profitMargin:   totals.profitMargin,
      version:        { increment: 1 },
    };

    if (dto.items) {
      updateData.items = {
        create: dto.items.map((item, idx) => ({
          day:          item.day,
          sortOrder:    item.sortOrder ?? idx,
          category:     item.category,
          name:         item.name,
          description:  item.description,
          resourceId:   item.resourceId,
          quantity:     item.quantity,
          unit:         item.unit ?? 'per_person',
          sellingPrice: item.sellingPrice,
          buyingPrice:  item.buyingPrice,
          markup:       item.buyingPrice > 0
            ? Math.round(((item.sellingPrice - item.buyingPrice) / item.buyingPrice) * 10000) / 100
            : 0,
          totalSelling: item.sellingPrice * item.quantity,
          totalCost:    item.buyingPrice  * item.quantity,
          currency:     item.currency ?? dto.currency ?? 'USD',
          date:         item.date ? new Date(item.date) : undefined,
          startTime:    item.startTime,
          endTime:      item.endTime,
          notes:        item.notes,
          isOptional:   item.isOptional ?? false,
          isIncluded:   item.isIncluded ?? true,
        })),
      };
    }

    return this.prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        items:    { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
      },
    });
  }

  // ── CHANGE STATUS ────────────────────────────────────────────
  async changeStatus(
    id: string,
    newStatus: QuotationStatus,
    organizationId: string,
    reason?: string,
  ) {
    const q = await this.findOne(id, organizationId);
    const current = q.status as string;
    const next    = newStatus as string;

    if (!VALID_STATUS_TRANSITIONS[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot change quotation from ${current} to ${next}`,
      );
    }

    const now = new Date();
    const statusMeta: Record<string, any> = {
      SENT:      { sentAt: now },
      VIEWED:    { viewedAt: now },
      APPROVED:  { approvedAt: now },
      REJECTED:  { rejectedAt: now, rejectedReason: reason },
    };

    return this.prisma.quotation.update({
      where: { id },
      data: { status: newStatus, ...(statusMeta[next] ?? {}) },
    });
  }

  // ── DUPLICATE ────────────────────────────────────────────────
  async duplicate(id: string, organizationId: string, createdById: string) {
    const original = await this.prisma.quotation.findFirst({
      where: { id, organizationId },
      include: { items: true },
    });
    if (!original) throw new NotFoundException(`Quotation ${id} not found`);
    const code     = await this.generateCode(organizationId);

    return this.prisma.quotation.create({
      data: {
        organizationId,
        createdById,
        code,
        title:          `[COPY] ${original.title}`,
        customerId:     original.customerId,
        leadId:         original.leadId ?? undefined,
        pax:            original.pax,
        paxAdult:       original.paxAdult,
        paxChild:       original.paxChild,
        travelDateFrom: original.travelDateFrom ?? undefined,
        travelDateTo:   original.travelDateTo   ?? undefined,
        duration:       original.duration        ?? undefined,
        destination:    original.destination     ?? undefined,
        tourType:       original.tourType        ?? undefined,
        subtotal:       original.subtotal,
        discountAmount: original.discountAmount,
        discountPct:    original.discountPct,
        taxAmount:      original.taxAmount,
        taxPct:         original.taxPct,
        totalAmount:    original.totalAmount,
        totalCost:      original.totalCost,
        profitAmount:   original.profitAmount,
        profitMargin:   original.profitMargin,
        currency:       original.currency,
        notes:          original.notes          ?? undefined,
        internalNotes:  original.internalNotes  ?? undefined,
        status:         'DRAFT',
        items: {
          create: (original.items as any[]).map((item: any) => ({
            day:          item.day,
            sortOrder:    item.sortOrder,
            category:     item.category,
            name:         item.name,
            description:  item.description,
            resourceId:   item.resourceId,
            quantity:     item.quantity,
            unit:         item.unit,
            sellingPrice: item.sellingPrice,
            buyingPrice:  item.buyingPrice,
            markup:       item.markup,
            totalSelling: item.totalSelling,
            totalCost:    item.totalCost,
            currency:     item.currency,
            date:         item.date,
            startTime:    item.startTime,
            endTime:      item.endTime,
            notes:        item.notes,
            isOptional:   item.isOptional,
            isIncluded:   item.isIncluded,
          })),
        },
      },
      include: {
        items:    { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
      },
    });
  }

  async getStats(organizationId: string) {
    const [byStatus, totalValue] = await Promise.all([
      this.prisma.quotation.groupBy({
        by:    ['status'],
        where: { organizationId },
        _count: { _all: true },
        _sum:   { totalAmount: true },
      }),
      this.prisma.quotation.aggregate({
        where: { organizationId, status: 'APPROVED' as any },
        _sum:  { totalAmount: true, profitAmount: true },
        _avg:  { profitMargin: true },
      }),
    ]);
    return { byStatus, approvedSummary: totalValue };
  }
}
