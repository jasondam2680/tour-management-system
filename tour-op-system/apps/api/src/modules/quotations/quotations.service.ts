import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { QuotationItemDto } from './dto/quotation-item.dto';
import { QuotationStatus, QuotationWorkflowStage } from '@prisma/client';
import { CreateProgramOptionDto } from './dto/create-program-option.dto';
import { CreateCostSheetDto } from './dto/create-cost-sheet.dto';

// Status transitions for quotations
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'REJECTED'],
  SENT: ['VIEWED', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  VIEWED: ['NEGOTIATING', 'APPROVED', 'REJECTED', 'EXPIRED'],
  NEGOTIATING: ['APPROVED', 'REJECTED', 'EXPIRED', 'DRAFT'],
  APPROVED: ['CONVERTED'],
  REJECTED: ['DRAFT'],
  EXPIRED: ['DRAFT'],
  CONVERTED: [],
};

interface Totals {
  subtotal: number;
  totalCost: number;
  discountAmt: number;
  taxAmount: number;
  totalAmount: number;
  profitAmount: number;
  profitMargin: number;
}

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  // ── Core calculation engine ──────────────────────────────────
  private calcTotals(
    items: QuotationItemDto[],
    discountAmount = 0,
    discountPct = 0,
    taxPct = 0,
  ): Totals {
    let subtotal = 0;
    let totalCost = 0;

    for (const item of items) {
      if (!item.isIncluded && item.isIncluded !== undefined) continue;
      const qty = item.quantity ?? 1;
      const selling = (item.sellingPrice ?? 0) * qty;
      const cost = (item.buyingPrice ?? 0) * qty;
      subtotal += selling;
      totalCost += cost;
    }

    // Apply discount
    const discountAmt = discountAmount > 0 ? discountAmount : (subtotal * discountPct) / 100;

    const afterDiscount = subtotal - discountAmt;
    const taxAmount = (afterDiscount * taxPct) / 100;
    const totalAmount = afterDiscount + taxAmount;
    const profitAmount = totalAmount - totalCost;
    const profitMargin = totalAmount > 0 ? (profitAmount / totalAmount) * 100 : 0;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      discountAmt: Math.round(discountAmt * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
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
    let items = dto.items ?? [];
    let itineraryVersionId: string | undefined;

    // Handle GROUP tour: copy from template
    if (dto.tourQuotationType === 'GROUP' && dto.groupTourTemplateId) {
      const template = await this.prisma.itinerary.findFirst({
        where: { id: dto.groupTourTemplateId, organizationId, isTemplate: true },
        include: {
          currentVersion: {
            include: {
              days: {
                orderBy: { dayNumber: 'asc' },
                include: { activities: { orderBy: { sortOrder: 'asc' } } },
              },
            },
          },
        },
      });

      if (!template || !template.currentVersion) {
        throw new BadRequestException('Group tour template not found or has no itinerary');
      }

      // Create a new itinerary version for this quotation (snapshot)
      const newVersion = await this.prisma.itineraryVersion.create({
        data: {
          itineraryId: template.id,
          versionNumber:
            (await this.prisma.itineraryVersion.count({ where: { itineraryId: template.id } })) + 1,
          title: template.title,
          overview: template.currentVersion.overview,
          notes: template.currentVersion.notes,
          isActive: false,
          days: {
            create: template.currentVersion.days.map((day) => ({
              dayNumber: day.dayNumber,
              title: day.title,
              description: day.description,
              meals: day.meals,
              accommodation: day.accommodation,
              activities: {
                create: day.activities.map((a) => ({
                  sortOrder: a.sortOrder,
                  time: a.time,
                  title: a.title,
                  description: a.description,
                  location: a.location,
                  duration: a.duration,
                  notes: a.notes,
                })),
              },
            })),
          },
        },
      });

      itineraryVersionId = newVersion.id;

      // Auto-create items from template package includes if no items provided
      if (items.length === 0 && template.packagePrice) {
        const pax = dto.pax || 1;
        items = [
          {
            category: 'tour_package',
            name: template.templateName || template.title,
            description: template.currentVersion.overview || 'Group tour package',
            quantity: pax,
            unit: 'per_person',
            sellingPrice: Number(template.packagePrice),
            buyingPrice: Number(template.packagePrice) * 0.7,
            currency: template.packagePriceCurrency || dto.currency || 'USD',
            isIncluded: true,
            isOptional: false,
          },
        ];
      }
    }

    // Handle PRIVATE tour: custom itinerary
    if (dto.tourQuotationType === 'PRIVATE' && dto.itinerary?.days?.length) {
      const newItinerary = await this.prisma.itinerary.create({
        data: {
          organizationId,
          code: await this.generateCode(organizationId),
          title: dto.title,
          isTemplate: false,
        },
      });

      const newVersion = await this.prisma.itineraryVersion.create({
        data: {
          itineraryId: newItinerary.id,
          versionNumber: 1,
          title: dto.title,
          overview: dto.itinerary.overview,
          notes: dto.itinerary.notes,
          isActive: false,
          days: {
            create: dto.itinerary.days.map((day) => ({
              dayNumber: day.dayNumber,
              title: day.title,
              description: day.description,
              meals: day.meals || [],
              accommodation: day.accommodation,
              activities: {
                create: (day.activities || []).map((a) => ({
                  sortOrder: a.sortOrder ?? 0,
                  time: a.time,
                  title: a.title,
                  description: a.description,
                  location: a.location,
                  duration: a.duration,
                  notes: a.notes,
                })),
              },
            })),
          },
        },
      });

      itineraryVersionId = newVersion.id;
    }

    const totals = this.calcTotals(items, dto.discountAmount, dto.discountPct, dto.taxPct);

    // Build item data with per-item totals and markup
    const itemsData = items.map((item, idx) => {
      const qty = item.quantity ?? 1;
      const totalSell = (item.sellingPrice ?? 0) * qty;
      const totalCost = (item.buyingPrice ?? 0) * qty;
      const markup =
        item.buyingPrice > 0
          ? ((item.sellingPrice - item.buyingPrice) / item.buyingPrice) * 100
          : 0;

      return {
        day: item.day,
        sortOrder: item.sortOrder ?? idx,
        category: item.category,
        name: item.name,
        description: item.description,
        resourceId: item.resourceId,
        quantity: qty,
        unit: item.unit ?? 'per_person',
        sellingPrice: item.sellingPrice,
        buyingPrice: item.buyingPrice,
        markup: Math.round(markup * 100) / 100,
        totalSelling: totalSell,
        totalCost,
        currency: item.currency ?? dto.currency ?? 'USD',
        date: item.date ? new Date(item.date) : undefined,
        startTime: item.startTime,
        endTime: item.endTime,
        notes: item.notes,
        isOptional: item.isOptional ?? false,
        isIncluded: item.isIncluded ?? true,
      };
    });

    return this.prisma.quotation.create({
      data: {
        organizationId,
        createdById,
        code,
        title: dto.title,
        customerId: dto.customerId,
        leadId: dto.leadId,
        pax: dto.pax,
        paxAdult: dto.paxAdult ?? dto.pax,
        paxChild: dto.paxChild ?? 0,
        travelDateFrom: dto.travelDateFrom ? new Date(dto.travelDateFrom) : undefined,
        travelDateTo: dto.travelDateTo ? new Date(dto.travelDateTo) : undefined,
        duration: dto.duration,
        destination: dto.destination,
        tourType: dto.tourType,
        tourQuotationType: dto.tourQuotationType,
        groupTourTemplateId: dto.groupTourTemplateId,
        itineraryVersionId,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmt,
        discountPct: dto.discountPct ?? 0,
        taxAmount: totals.taxAmount,
        taxPct: dto.taxPct ?? 0,
        totalAmount: totals.totalAmount,
        totalCost: totals.totalCost,
        profitAmount: totals.profitAmount,
        profitMargin: totals.profitMargin,
        currency: dto.currency ?? 'USD',
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        status: 'DRAFT',
        items: { create: itemsData },
      },
      include: {
        items: { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer: {
          select: { id: true, firstName: true, lastName: true, companyName: true, type: true },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        itineraryVersion: {
          include: { days: { include: { activities: true }, orderBy: { dayNumber: 'asc' } } },
        },
      },
    });
  }

  // ── LIST ─────────────────────────────────────────────────────
  async findAll(query: QueryQuotationDto, organizationId: string) {
    const {
      search,
      status,
      customerId,
      leadId,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const where: any = {
      organizationId,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(leadId && { leadId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
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
          customer: {
            select: { id: true, firstName: true, lastName: true, companyName: true, type: true },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { items: true } },
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
        items: { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer: true,
        lead: { select: { id: true, title: true, status: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        itineraryVersion: {
          include: { days: { include: { activities: true }, orderBy: { dayNumber: 'asc' } } },
        },
        programOptions: { orderBy: { optionNo: 'asc' } },
        costSheets: { include: { lines: { orderBy: { sortOrder: 'asc' } } }, orderBy: { version: 'desc' } },
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
      dto.discountPct ?? Number(existing.discountPct),
      dto.taxPct ?? Number(existing.taxPct),
    );

    // Recalculate items if provided
    if (dto.items) {
      await this.prisma.quotationItem.deleteMany({ where: { quotationId: id } });
    }

    const updateData: any = {
      ...(dto.title && { title: dto.title }),
      ...(dto.pax && { pax: dto.pax }),
      ...(dto.paxAdult && { paxAdult: dto.paxAdult }),
      ...(dto.paxChild !== undefined && { paxChild: dto.paxChild }),
      ...(dto.travelDateFrom && { travelDateFrom: new Date(dto.travelDateFrom) }),
      ...(dto.travelDateTo && { travelDateTo: new Date(dto.travelDateTo) }),
      ...(dto.duration && { duration: dto.duration }),
      ...(dto.destination && { destination: dto.destination }),
      ...(dto.tourType && { tourType: dto.tourType }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.notes && { notes: dto.notes }),
      ...(dto.internalNotes && { internalNotes: dto.internalNotes }),
      ...(dto.validUntil && { validUntil: new Date(dto.validUntil) }),
      ...(dto.rejectedReason && { rejectedReason: dto.rejectedReason }),
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmt,
      discountPct: dto.discountPct ?? existing.discountPct,
      taxAmount: totals.taxAmount,
      taxPct: dto.taxPct ?? existing.taxPct,
      totalAmount: totals.totalAmount,
      totalCost: totals.totalCost,
      profitAmount: totals.profitAmount,
      profitMargin: totals.profitMargin,
      version: { increment: 1 },
    };

    if (dto.items) {
      updateData.items = {
        create: dto.items.map((item, idx) => ({
          day: item.day,
          sortOrder: item.sortOrder ?? idx,
          category: item.category,
          name: item.name,
          description: item.description,
          resourceId: item.resourceId,
          quantity: item.quantity,
          unit: item.unit ?? 'per_person',
          sellingPrice: item.sellingPrice,
          buyingPrice: item.buyingPrice,
          markup:
            item.buyingPrice > 0
              ? Math.round(((item.sellingPrice - item.buyingPrice) / item.buyingPrice) * 10000) /
                100
              : 0,
          totalSelling: item.sellingPrice * item.quantity,
          totalCost: item.buyingPrice * item.quantity,
          currency: item.currency ?? dto.currency ?? 'USD',
          date: item.date ? new Date(item.date) : undefined,
          startTime: item.startTime,
          endTime: item.endTime,
          notes: item.notes,
          isOptional: item.isOptional ?? false,
          isIncluded: item.isIncluded ?? true,
        })),
      };
    }

    return this.prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        items: { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer: {
          select: { id: true, firstName: true, lastName: true, companyName: true, type: true },
        },
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
    const next = newStatus as string;

    if (!VALID_STATUS_TRANSITIONS[current]?.includes(next)) {
      throw new BadRequestException(`Cannot change quotation from ${current} to ${next}`);
    }

    const now = new Date();
    const statusMeta: Record<string, any> = {
      SENT: { sentAt: now },
      VIEWED: { viewedAt: now },
      APPROVED: { approvedAt: now },
      REJECTED: { rejectedAt: now, rejectedReason: reason },
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
    const code = await this.generateCode(organizationId);

    return this.prisma.quotation.create({
      data: {
        organizationId,
        createdById,
        code,
        title: `[COPY] ${original.title}`,
        customerId: original.customerId,
        leadId: original.leadId ?? undefined,
        pax: original.pax,
        paxAdult: original.paxAdult,
        paxChild: original.paxChild,
        travelDateFrom: original.travelDateFrom ?? undefined,
        travelDateTo: original.travelDateTo ?? undefined,
        duration: original.duration ?? undefined,
        destination: original.destination ?? undefined,
        tourType: original.tourType ?? undefined,
        subtotal: original.subtotal,
        discountAmount: original.discountAmount,
        discountPct: original.discountPct,
        taxAmount: original.taxAmount,
        taxPct: original.taxPct,
        totalAmount: original.totalAmount,
        totalCost: original.totalCost,
        profitAmount: original.profitAmount,
        profitMargin: original.profitMargin,
        currency: original.currency,
        notes: original.notes ?? undefined,
        internalNotes: original.internalNotes ?? undefined,
        status: 'DRAFT',
        items: {
          create: (original.items as any[]).map((item: any) => ({
            day: item.day,
            sortOrder: item.sortOrder,
            category: item.category,
            name: item.name,
            description: item.description,
            resourceId: item.resourceId,
            quantity: item.quantity,
            unit: item.unit,
            sellingPrice: item.sellingPrice,
            buyingPrice: item.buyingPrice,
            markup: item.markup,
            totalSelling: item.totalSelling,
            totalCost: item.totalCost,
            currency: item.currency,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            notes: item.notes,
            isOptional: item.isOptional,
            isIncluded: item.isIncluded,
          })),
        },
      },
      include: {
        items: { orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }] },
        customer: {
          select: { id: true, firstName: true, lastName: true, companyName: true, type: true },
        },
      },
    });
  }

  async createProgramOption(id: string, dto: CreateProgramOptionDto, organizationId: string) {
    await this.findOne(id, organizationId);
    const option = await this.prisma.quotationProgramOption.create({
      data: {
        quotationId: id,
        optionNo: dto.optionNo,
        title: dto.title,
        summary: dto.summary,
        itineraryVersionId: dto.itineraryVersionId,
      },
    });
    await this.prisma.quotation.update({
      where: { id },
      data: { workflowStage: QuotationWorkflowStage.PROGRAM_OPTIONS },
    });
    return option;
  }

  async createCostSheet(id: string, dto: CreateCostSheetDto, organizationId: string) {
    await this.findOne(id, organizationId);
    const latest = await this.prisma.quotationCostSheet.findFirst({
      where: { quotationId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (latest?.version ?? 0) + 1;
    const costSheet = await this.prisma.quotationCostSheet.create({
      data: {
        quotationId: id,
        version,
        title: dto.title,
        notes: dto.notes,
        lines: {
          create: dto.lines.map((line, index) => ({
            sortOrder: index,
            category: line.category,
            name: line.name,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            serviceCount: line.serviceCount,
            total: line.quantity * line.unitPrice * line.serviceCount,
            currency: line.currency,
            supplierName: line.supplierName,
            isIncluded: line.isIncluded ?? true,
            notes: line.notes,
          })),
        },
      },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    await this.prisma.quotation.update({
      where: { id },
      data: { workflowStage: QuotationWorkflowStage.COST_SHEET },
    });
    return costSheet;
  }

  async updateWorkflowStage(
    id: string,
    stage: QuotationWorkflowStage,
    organizationId: string,
    note?: string,
  ) {
    await this.findOne(id, organizationId);
    const now = new Date();
    return this.prisma.quotation.update({
      where: { id },
      data: {
        workflowStage: stage,
        ...(stage === QuotationWorkflowStage.CUSTOMER_APPROVED
          ? { customerApprovedAt: now, approvedAt: now }
          : {}),
        ...(note ? { notes: note } : {}),
      },
    });
  }

  async createCustomerShare(id: string, organizationId: string) {
    const quotation = await this.findOne(id, organizationId);
    const token = randomBytes(24).toString('hex');
    const workflowStage = quotation.workflowStage === QuotationWorkflowStage.CUSTOMER_BRIEF
      ? QuotationWorkflowStage.PROGRAM_OPTIONS
      : quotation.workflowStage;
    return this.prisma.quotation.update({
      where: { id },
      data: { customerShareToken: token, workflowStage },
      select: { id: true, code: true, customerShareToken: true, workflowStage: true },
    });
  }

  async getCustomerShare(token: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { customerShareToken: token },
      include: {
        customer: { select: { firstName: true, lastName: true, companyName: true } },
        programOptions: { orderBy: { optionNo: 'asc' } },
        itineraryVersion: {
          include: { days: { include: { activities: true }, orderBy: { dayNumber: 'asc' } } },
        },
        items: {
          where: { isIncluded: true },
          orderBy: [{ day: 'asc' }, { sortOrder: 'asc' }],
          select: {
            day: true, category: true, name: true, description: true, quantity: true,
            unit: true, sellingPrice: true, totalSelling: true, currency: true, date: true,
            startTime: true, endTime: true, isOptional: true, isIncluded: true,
          },
        },
      },
    });
    if (!quotation) throw new NotFoundException('Shared quotation not found');
    return quotation;
  }

  async selectCustomerProgram(token: string, optionNo: number) {
    const quotation = await this.getCustomerShare(token);
    const option = quotation.programOptions.find((item) => item.optionNo === optionNo);
    if (!option) throw new NotFoundException('Program option not found');
    await this.prisma.quotationProgramOption.updateMany({
      where: { quotationId: quotation.id },
      data: { isSelected: false, selectedAt: null },
    });
    await this.prisma.quotationProgramOption.update({
      where: { id: option.id },
      data: { isSelected: true, selectedAt: new Date() },
    });
    await this.prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        workflowStage: QuotationWorkflowStage.PROGRAM_SELECTED,
        customerSelectedAt: new Date(),
      },
    });
    return this.getCustomerShare(token);
  }

  async getStats(organizationId: string) {
    const [byStatus, totalValue] = await Promise.all([
      this.prisma.quotation.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.quotation.aggregate({
        where: { organizationId, status: 'APPROVED' as any },
        _sum: { totalAmount: true, profitAmount: true },
        _avg: { profitMargin: true },
      }),
    ]);
    return { byStatus, approvedSummary: totalValue };
  }
}
