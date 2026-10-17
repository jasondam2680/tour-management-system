// apps/api/src/modules/guides/guides.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma, GuideAdvanceStatus, GuideSettlementStatus,
} from '@prisma/client';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { QueryGuideDto } from './dto/query-guide.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { CreateAdvanceDto } from './dto/create-advance.dto';
import { UpdateAdvanceDto } from './dto/update-advance.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { CreateSettlementLineDto } from './dto/settlement-line.dto';
import { UpdateSettlementLineDto } from './dto/update-settlement-line.dto';

@Injectable()
export class GuidesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private async nextCode(organizationId: string, prefix: string, model: 'guide' | 'advance' | 'settlement') {
    const delegate =
      model === 'guide' ? this.prisma.guide
      : model === 'advance' ? this.prisma.guideAdvance
      : this.prisma.guideSettlement;
    const count = await (delegate as any).count({ where: { organizationId } });
    return `${prefix}-${(count + 1).toString().padStart(4, '0')}`;
  }

  private async ensureGuide(guideId: string, organizationId: string) {
    const guide = await this.prisma.guide.findFirst({
      where: { id: guideId, organizationId },
    });
    if (!guide) throw new NotFoundException(`Guide ${guideId} not found`);
    return guide;
  }

  private async ensureTour(tourId: string, organizationId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, organizationId },
    });
    if (!tour) throw new NotFoundException(`Tour ${tourId} not found`);
    return tour;
  }

  // ===========================================================================
  // GUIDE CRUD
  // ===========================================================================

  async createGuide(dto: CreateGuideDto, organizationId: string) {
    const code = await this.nextCode(organizationId, 'HDV', 'guide');
    return this.prisma.guide.create({
      data: {
        code,
        organizationId,
        fullName: dto.fullName,
        phone: dto.phone,
        idCard: dto.idCard,
        licenseNo: dto.licenseNo,
        languages: dto.languages ?? [],
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
        accountName: dto.accountName,
        defaultDailyRate: dto.defaultDailyRate,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async findAllGuides(query: QueryGuideDto, organizationId: string) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 100;
    const skip = (page - 1) * limit;

    const where: Prisma.GuideWhereInput = { organizationId };
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { licenseNo: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.guide.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { assignments: true, advances: true, settlements: true } } },
      }),
      this.prisma.guide.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOneGuide(id: string, organizationId: string) {
    const guide = await this.prisma.guide.findFirst({
      where: { id, organizationId },
      include: {
        assignments: {
          include: { tour: { select: { id: true, code: true, title: true, travelDateFrom: true, travelDateTo: true } } },
          orderBy: { createdAt: 'desc' },
        },
        advances: { orderBy: { advanceDate: 'desc' }, take: 20 },
        settlements: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!guide) throw new NotFoundException(`Guide ${id} not found`);
    return guide;
  }

  async updateGuide(id: string, dto: UpdateGuideDto, organizationId: string) {
    await this.ensureGuide(id, organizationId);
    return this.prisma.guide.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        idCard: dto.idCard,
        licenseNo: dto.licenseNo,
        languages: dto.languages,
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
        accountName: dto.accountName,
        defaultDailyRate: dto.defaultDailyRate,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async removeGuide(id: string, organizationId: string) {
    await this.ensureGuide(id, organizationId);
    // Soft-delete: chuyển sang INACTIVE để giữ lịch sử phân công/tạm ứng/quyết toán
    return this.prisma.guide.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  // ===========================================================================
  // ASSIGNMENTS (phân công HDV theo đoàn)
  // ===========================================================================

  async createAssignment(guideId: string, dto: CreateAssignmentDto, organizationId: string) {
    const guide = await this.ensureGuide(guideId, organizationId);
    await this.ensureTour(dto.tourId, organizationId);

    const days = dto.days !== undefined ? Number(dto.days) : undefined;
    const dailyRate = dto.dailyRate !== undefined
      ? Number(dto.dailyRate)
      : (guide.defaultDailyRate !== null && guide.defaultDailyRate !== undefined
        ? Number(guide.defaultDailyRate) : undefined);
    const fee = days !== undefined && dailyRate !== undefined ? days * dailyRate : undefined;

    return this.prisma.guideAssignment.create({
      data: {
        guideId,
        tourId: dto.tourId,
        role: dto.role ?? 'GUIDE',
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        days,
        dailyRate,
        fee,
        currency: dto.currency,
        notes: dto.notes,
      },
      include: { tour: { select: { id: true, code: true, title: true } } },
    });
  }

  async findAssignments(guideId: string, organizationId: string) {
    await this.ensureGuide(guideId, organizationId);
    return this.prisma.guideAssignment.findMany({
      where: { guideId },
      include: { tour: { select: { id: true, code: true, title: true, travelDateFrom: true, travelDateTo: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAssignment(assignmentId: string, guideId: string, dto: UpdateAssignmentDto, organizationId: string) {
    await this.ensureGuide(guideId, organizationId);
    const existing = await this.prisma.guideAssignment.findFirst({
      where: { id: assignmentId, guideId },
    });
    if (!existing) throw new NotFoundException(`Assignment ${assignmentId} not found`);

    const days = dto.days !== undefined ? Number(dto.days) : Number(existing.days ?? 0) || undefined;
    const dailyRate = dto.dailyRate !== undefined ? Number(dto.dailyRate) : existing.dailyRate !== null ? Number(existing.dailyRate) : undefined;
    const fee = days !== undefined && dailyRate !== undefined ? days * dailyRate : undefined;

    return this.prisma.guideAssignment.update({
      where: { id: assignmentId },
      data: {
        tourId: dto.tourId,
        role: dto.role,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        days: dto.days !== undefined ? days : undefined,
        dailyRate: dto.dailyRate !== undefined ? dailyRate : undefined,
        fee,
        currency: dto.currency,
        notes: dto.notes,
      },
    });
  }

  async removeAssignment(assignmentId: string, guideId: string, organizationId: string) {
    await this.ensureGuide(guideId, organizationId);
    const existing = await this.prisma.guideAssignment.findFirst({
      where: { id: assignmentId, guideId },
    });
    if (!existing) throw new NotFoundException(`Assignment ${assignmentId} not found`);
    await this.prisma.guideAssignment.delete({ where: { id: assignmentId } });
    return { success: true };
  }

  // ===========================================================================
  // ADVANCES (tạm ứng / vay HDV)
  // ===========================================================================

  async createAdvance(dto: CreateAdvanceDto, organizationId: string) {
    if (!dto.guideId) throw new BadRequestException('guideId là bắt buộc');
    await this.ensureGuide(dto.guideId, organizationId);
    if (dto.tourId) await this.ensureTour(dto.tourId, organizationId);

    const code = await this.nextCode(organizationId, 'TU', 'advance');
    const amount = Number(dto.amount);
    const exchangeRate = dto.exchangeRate !== undefined ? Number(dto.exchangeRate) : 1;

    return this.prisma.guideAdvance.create({
      data: {
        code,
        organizationId,
        guideId: dto.guideId,
        tourId: dto.tourId,
        amount,
        currency: dto.currency,
        exchangeRate,
        amountBase: amount * exchangeRate,
        method: dto.method ?? 'bank_transfer',
        advanceDate: dto.advanceDate ? new Date(dto.advanceDate) : new Date(),
        bankAccount: dto.bankAccount,
        notes: dto.notes,
        status: 'PENDING',
      },
      include: {
        guide: { select: { id: true, code: true, fullName: true } },
        tour: { select: { id: true, code: true, title: true } },
      },
    });
  }

  async findAllAdvances(organizationId: string, guideId?: string, status?: GuideAdvanceStatus) {
    const where: Prisma.GuideAdvanceWhereInput = { organizationId };
    if (guideId) where.guideId = guideId;
    if (status) where.status = status;
    return this.prisma.guideAdvance.findMany({
      where,
      include: {
        guide: { select: { id: true, code: true, fullName: true } },
        tour: { select: { id: true, code: true, title: true } },
      },
      orderBy: { advanceDate: 'desc' },
    });
  }

  async findOneAdvance(id: string, organizationId: string) {
    const advance = await this.prisma.guideAdvance.findFirst({
      where: { id, organizationId },
      include: {
        guide: { select: { id: true, code: true, fullName: true, phone: true, bankAccount: true, bankName: true } },
        tour: { select: { id: true, code: true, title: true } },
      },
    });
    if (!advance) throw new NotFoundException(`Advance ${id} not found`);
    return advance;
  }

  async updateAdvance(id: string, dto: UpdateAdvanceDto, organizationId: string) {
    const existing = await this.findOneAdvance(id, organizationId);
    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Chỉ được sửa tạm ứng ở trạng thái PENDING');
    }
    if (dto.guideId) await this.ensureGuide(dto.guideId, organizationId);
    if (dto.tourId) await this.ensureTour(dto.tourId, organizationId);

    const amount = dto.amount !== undefined ? Number(dto.amount) : Number(existing.amount);
    const exchangeRate = dto.exchangeRate !== undefined ? Number(dto.exchangeRate) : Number(existing.exchangeRate);

    return this.prisma.guideAdvance.update({
      where: { id },
      data: {
        guideId: dto.guideId,
        tourId: dto.tourId,
        amount: dto.amount !== undefined ? amount : undefined,
        currency: dto.currency,
        exchangeRate: dto.exchangeRate !== undefined ? exchangeRate : undefined,
        amountBase: amount * exchangeRate,
        method: dto.method,
        advanceDate: dto.advanceDate ? new Date(dto.advanceDate) : undefined,
        bankAccount: dto.bankAccount,
        notes: dto.notes,
      },
    });
  }

  async transitionAdvance(id: string, to: GuideAdvanceStatus, organizationId: string) {
    const existing = await this.findOneAdvance(id, organizationId);
    const allowed: Record<GuideAdvanceStatus, GuideAdvanceStatus[]> = {
      PENDING: ['APPROVED', 'CANCELLED'],
      APPROVED: ['PAID', 'CANCELLED'],
      PAID: ['SETTLED'],
      SETTLED: [],
      CANCELLED: [],
    };
    if (!allowed[existing.status].includes(to)) {
      throw new BadRequestException(`Không thể chuyển tạm ứng từ ${existing.status} sang ${to}`);
    }
    return this.prisma.guideAdvance.update({
      where: { id },
      data: {
        status: to,
        settledAt: to === 'SETTLED' ? new Date() : undefined,
      },
    });
  }

  async removeAdvance(id: string, organizationId: string) {
    const existing = await this.findOneAdvance(id, organizationId);
    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Chỉ được xóa tạm ứng ở trạng thái PENDING');
    }
    await this.prisma.guideAdvance.delete({ where: { id } });
    return { success: true };
  }

  // ===========================================================================
  // SETTLEMENTS (quyết toán HDV)
  // ===========================================================================

  /**
   * Công thức quyết toán (server-side, tính lại mỗi khi create/update ở DRAFT):
   *   perDiem      = days × dailyRate
   *   pitTax       = round(perDiem × pitRate / 100)  // thuế TNCN chỉ tính trên công tác phí
   *   totalExpenses= Σ dòng chi phí
   *   netPayable   = perDiem + tipAmount + otherIncome + totalExpenses − advanceDeduction − pitTax
   */
  private calcSettlement(input: {
    days: number; dailyRate: number; tipAmount: number; otherIncome: number;
    advanceDeduction: number; pitRate: number; linesTotal: number;
  }) {
    const perDiem = input.days * input.dailyRate;
    const pitTax = Math.round((perDiem * input.pitRate) / 100);
    const netPayable = perDiem + input.tipAmount + input.otherIncome + input.linesTotal
      - input.advanceDeduction - pitTax;
    return { perDiem, pitTax, totalExpenses: input.linesTotal, netPayable };
  }

  async createSettlement(dto: CreateSettlementDto, organizationId: string) {
    await this.ensureGuide(dto.guideId, organizationId);
    if (dto.tourId) await this.ensureTour(dto.tourId, organizationId);

    const code = await this.nextCode(organizationId, 'QT-HDV', 'settlement');
    const days = dto.days !== undefined ? Number(dto.days) : 0;
    const dailyRate = dto.dailyRate !== undefined ? Number(dto.dailyRate) : 0;
    const tipAmount = dto.tipAmount !== undefined ? Number(dto.tipAmount) : 0;
    const otherIncome = dto.otherIncome !== undefined ? Number(dto.otherIncome) : 0;
    const advanceDeduction = dto.advanceDeduction !== undefined ? Number(dto.advanceDeduction) : 0;
    const pitRate = dto.pitRate !== undefined ? Number(dto.pitRate) : 10;
    const calc = this.calcSettlement({ days, dailyRate, tipAmount, otherIncome, advanceDeduction, pitRate, linesTotal: 0 });

    return this.prisma.guideSettlement.create({
      data: {
        code,
        organizationId,
        guideId: dto.guideId,
        tourId: dto.tourId,
        days, dailyRate,
        perDiem: calc.perDiem,
        tipAmount, otherIncome,
        totalExpenses: 0,
        advanceDeduction,
        pitRate, pitTax: calc.pitTax,
        netPayable: calc.netPayable,
        currency: dto.currency,
        status: 'DRAFT',
        preparedBy: dto.preparedBy,
        approvedBy: dto.approvedBy,
        notes: dto.notes,
      },
      include: {
        guide: { select: { id: true, code: true, fullName: true, phone: true, bankAccount: true, bankName: true, accountName: true } },
        tour: { select: { id: true, code: true, title: true, travelDateFrom: true, travelDateTo: true } },
        lines: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findAllSettlements(organizationId: string, filters?: { guideId?: string; tourId?: string; status?: GuideSettlementStatus }) {
    const where: Prisma.GuideSettlementWhereInput = { organizationId };
    if (filters?.guideId) where.guideId = filters.guideId;
    if (filters?.tourId) where.tourId = filters.tourId;
    if (filters?.status) where.status = filters.status;
    return this.prisma.guideSettlement.findMany({
      where,
      include: {
        guide: { select: { id: true, code: true, fullName: true } },
        tour: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneSettlement(id: string, organizationId: string) {
    const settlement = await this.prisma.guideSettlement.findFirst({
      where: { id, organizationId },
      include: {
        guide: {
          select: {
            id: true, code: true, fullName: true, phone: true, idCard: true,
            licenseNo: true, bankAccount: true, bankName: true, accountName: true,
          },
        },
        tour: {
          select: {
            id: true, code: true, title: true, pax: true,
            travelDateFrom: true, travelDateTo: true, destination: true,
          },
        },
        lines: { orderBy: { sortOrder: 'asc' } },
        organization: {
          select: { id: true, name: true, address: true, phone: true, taxCode: true, email: true },
        },
      },
    });
    if (!settlement) throw new NotFoundException(`Settlement ${id} not found`);
    return settlement;
  }

  private async recalcSettlement(id: string) {
    const settlement = await this.prisma.guideSettlement.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!settlement) throw new NotFoundException(`Settlement ${id} not found`);
    const linesTotal = settlement.lines.reduce((sum, l) => sum + Number(l.amount), 0);
    const calc = this.calcSettlement({
      days: Number(settlement.days),
      dailyRate: Number(settlement.dailyRate),
      tipAmount: Number(settlement.tipAmount),
      otherIncome: Number(settlement.otherIncome),
      advanceDeduction: Number(settlement.advanceDeduction),
      pitRate: Number(settlement.pitRate),
      linesTotal,
    });
    return this.prisma.guideSettlement.update({
      where: { id },
      data: {
        perDiem: calc.perDiem,
        totalExpenses: calc.totalExpenses,
        pitTax: calc.pitTax,
        netPayable: calc.netPayable,
      },
    });
  }

  async updateSettlement(id: string, dto: UpdateSettlementDto, organizationId: string) {
    const existing = await this.findOneSettlement(id, organizationId);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ được sửa quyết toán ở trạng thái DRAFT');
    }
    if (dto.guideId) await this.ensureGuide(dto.guideId, organizationId);
    if (dto.tourId) await this.ensureTour(dto.tourId, organizationId);

    await this.prisma.guideSettlement.update({
      where: { id },
      data: {
        guideId: dto.guideId,
        tourId: dto.tourId,
        days: dto.days !== undefined ? Number(dto.days) : undefined,
        dailyRate: dto.dailyRate !== undefined ? Number(dto.dailyRate) : undefined,
        tipAmount: dto.tipAmount !== undefined ? Number(dto.tipAmount) : undefined,
        otherIncome: dto.otherIncome !== undefined ? Number(dto.otherIncome) : undefined,
        advanceDeduction: dto.advanceDeduction !== undefined ? Number(dto.advanceDeduction) : undefined,
        pitRate: dto.pitRate !== undefined ? Number(dto.pitRate) : undefined,
        currency: dto.currency,
        preparedBy: dto.preparedBy,
        approvedBy: dto.approvedBy,
        notes: dto.notes,
      },
    });
    return this.recalcSettlement(id);
  }

  async transitionSettlement(id: string, to: GuideSettlementStatus, organizationId: string) {
    const existing = await this.findOneSettlement(id, organizationId);
    const allowed: Record<GuideSettlementStatus, GuideSettlementStatus[]> = {
      DRAFT: ['SUBMITTED', 'CANCELLED'],
      SUBMITTED: ['APPROVED', 'CANCELLED'],
      APPROVED: ['PAID', 'CANCELLED'],
      PAID: [],
      CANCELLED: [],
    };
    if (!allowed[existing.status].includes(to)) {
      throw new BadRequestException(`Không thể chuyển quyết toán từ ${existing.status} sang ${to}`);
    }
    // Khi duyệt thanh toán: đánh dấu các tạm ứng của đoàn là SETTLED
    if (to === 'PAID' && existing.tourId) {
      await this.prisma.guideAdvance.updateMany({
        where: {
          organizationId,
          guideId: existing.guideId,
          tourId: existing.tourId,
          status: 'PAID',
        },
        data: { status: 'SETTLED', settledAt: new Date() },
      });
    }
    return this.prisma.guideSettlement.update({
      where: { id },
      data: {
        status: to,
        paidAt: to === 'PAID' ? new Date() : undefined,
      },
    });
  }

  async removeSettlement(id: string, organizationId: string) {
    const existing = await this.findOneSettlement(id, organizationId);
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ được xóa quyết toán ở trạng thái DRAFT');
    }
    await this.prisma.guideSettlement.delete({ where: { id } });
    return { success: true };
  }

  // ===========================================================================
  // SETTLEMENT LINES (dòng chi phí HDV đã chi)
  // ===========================================================================

  async createLine(settlementId: string, dto: CreateSettlementLineDto, organizationId: string) {
    const settlement = await this.findOneSettlement(settlementId, organizationId);
    if (settlement.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ được thêm dòng chi phí ở trạng thái DRAFT');
    }
    const line = await this.prisma.guideSettlementLine.create({
      data: {
        settlementId,
        description: dto.description,
        amount: Number(dto.amount),
        notes: dto.notes,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.recalcSettlement(settlementId);
    return line;
  }

  async updateLine(lineId: string, settlementId: string, dto: UpdateSettlementLineDto, organizationId: string) {
    const settlement = await this.findOneSettlement(settlementId, organizationId);
    if (settlement.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ được sửa dòng chi phí ở trạng thái DRAFT');
    }
    const existing = await this.prisma.guideSettlementLine.findFirst({
      where: { id: lineId, settlementId },
    });
    if (!existing) throw new NotFoundException(`Line ${lineId} not found`);
    const line = await this.prisma.guideSettlementLine.update({
      where: { id: lineId },
      data: {
        description: dto.description,
        amount: dto.amount !== undefined ? Number(dto.amount) : undefined,
        notes: dto.notes,
        sortOrder: dto.sortOrder,
      },
    });
    await this.recalcSettlement(settlementId);
    return line;
  }

  async removeLine(lineId: string, settlementId: string, organizationId: string) {
    const settlement = await this.findOneSettlement(settlementId, organizationId);
    if (settlement.status !== 'DRAFT') {
      throw new BadRequestException('Chỉ được xóa dòng chi phí ở trạng thái DRAFT');
    }
    const existing = await this.prisma.guideSettlementLine.findFirst({
      where: { id: lineId, settlementId },
    });
    if (!existing) throw new NotFoundException(`Line ${lineId} not found`);
    await this.prisma.guideSettlementLine.delete({ where: { id: lineId } });
    await this.recalcSettlement(settlementId);
    return { success: true };
  }
}
