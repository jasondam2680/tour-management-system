// apps/api/src/modules/tour-audits/tour-audits.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TourAuditStatus, AuditLineStatus, AuditSourceType,
} from '@prisma/client';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { CreateAuditLineDto } from './dto/create-audit-line.dto';
import { UpdateAuditLineDto } from './dto/update-audit-line.dto';
import { ReviewAuditLineDto } from './dto/review-audit-line.dto';

const clean = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
};

const N = (v: any): number => Number(v ?? 0);

const AUDIT_FLOW: Record<TourAuditStatus, TourAuditStatus[]> = {
  OPEN: [TourAuditStatus.SUBMITTED],
  SUBMITTED: [TourAuditStatus.REVIEWED, TourAuditStatus.OPEN],
  REVIEWED: [TourAuditStatus.APPROVED, TourAuditStatus.SUBMITTED],
  APPROVED: [TourAuditStatus.CLOSED, TourAuditStatus.REVIEWED],
  CLOSED: [TourAuditStatus.OPEN],
};

const SERVICE_TYPE_LABEL: Record<string, string> = {
  ATTRACTION: 'Vé tham quan',
  HOTEL: 'Khách sạn',
  MEAL: 'Bữa ăn',
  TRANSPORT: 'Xe',
  FLIGHT: 'Vé máy bay',
  INSURANCE: 'Bảo hiểm',
  VISA: 'Visa',
  GUIDE_SERVICE: 'HDV',
  SHOPPING: 'Mua sắm',
  OTHER: 'Khác',
};

@Injectable()
export class TourAuditsService {
  constructor(private readonly prisma: PrismaService) {}

  private async mustGetAudit(auditId: string, organizationId: string) {
    const audit = await this.prisma.tourAudit.findFirst({
      where: { id: auditId, organizationId },
      include: { lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }, tour: true },
    });
    if (!audit) throw new NotFoundException('Không tìm thấy phiếu kiểm toán');
    return audit;
  }

  private async mustGetLine(lineId: string, organizationId: string) {
    const line = await this.prisma.tourAuditLine.findFirst({
      where: { id: lineId, audit: { organizationId } },
      include: { audit: true },
    });
    if (!line) throw new NotFoundException('Không tìm thấy dòng kiểm toán');
    return line;
  }

  // Mở kiểm toán cho đoàn + tự sinh lines từ sắp xếp DV và quyết toán HDV
  async openAudit(tourId: string, organizationId: string) {
    const tour = await this.prisma.tour.findFirst({ where: { id: tourId, organizationId } });
    if (!tour) throw new NotFoundException('Không tìm thấy đoàn');

    const existed = await this.prisma.tourAudit.findFirst({ where: { tourId, organizationId } });
    if (existed) throw new BadRequestException('Đoàn đã có phiếu kiểm toán');

    const arrangements = await this.prisma.tourServiceArrangement.findMany({
      where: { tourId, organizationId, status: { in: ['CONFIRMED', 'PAID'] } },
      include: { supplier: true },
      orderBy: { sortOrder: 'asc' },
    });
    const settlements = await this.prisma.guideSettlement.findMany({
      where: { tourId, organizationId, status: { in: ['APPROVED', 'PAID'] } },
      include: { guide: true },
      orderBy: { createdAt: 'asc' },
    });

    let order = 0;
    const lines = [
      ...arrangements.map((a) => ({
        sourceType: AuditSourceType.ARRANGEMENT,
        sourceId: a.id,
        description: `[${SERVICE_TYPE_LABEL[a.serviceType] ?? a.serviceType}] ${a.description || a.supplier?.name || ''}`.trim(),
        claimedAmount: a.totalAmount,
        currency: a.currency,
        sortOrder: order++,
      })),
      ...settlements.map((s) => ({
        sourceType: AuditSourceType.GUIDE_SETTLEMENT,
        sourceId: s.id,
        description: `Quyết toán HDV ${s.guide?.fullName || ''} (${s.code})`.trim(),
        claimedAmount: s.netPayable,
        currency: s.currency,
        sortOrder: order++,
      })),
    ];

    return this.prisma.tourAudit.create({
      data: {
        organizationId,
        tourId,
        lines: { create: lines },
      },
      include: { lines: true, tour: true },
    });
  }

  async getByTour(tourId: string, organizationId: string) {
    const audit = await this.prisma.tourAudit.findFirst({
      where: { tourId, organizationId },
      include: { lines: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] }, tour: true },
    });
    if (!audit) throw new NotFoundException('Đoàn chưa mở kiểm toán');
    return audit;
  }

  async createLine(auditId: string, dto: CreateAuditLineDto, organizationId: string) {
    const audit = await this.mustGetAudit(auditId, organizationId);
    if (audit.status === TourAuditStatus.CLOSED)
      throw new BadRequestException('Phiếu đã khóa sổ, không thêm dòng được');
    const maxOrder = await this.prisma.tourAuditLine.aggregate({
      where: { auditId }, _max: { sortOrder: true },
    });
    return this.prisma.tourAuditLine.create({
      data: {
        auditId,
        sourceType: dto.sourceType ?? AuditSourceType.MANUAL,
        sourceId: clean(dto.sourceId),
        description: dto.description.trim(),
        claimedAmount: dto.claimedAmount,
        currency: dto.currency ?? 'VND',
        notes: clean(dto.notes),
        sortOrder: dto.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });
  }

  async updateLine(lineId: string, dto: UpdateAuditLineDto, organizationId: string) {
    const line = await this.mustGetLine(lineId, organizationId);
    if (line.audit.status === TourAuditStatus.CLOSED)
      throw new BadRequestException('Phiếu đã khóa sổ, không sửa được');
    const data: any = {};
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.claimedAmount !== undefined) {
      data.claimedAmount = dto.claimedAmount;
      // Sửa số kê khai sau khi đã duyệt -> đưa về PENDING để duyệt lại
      if (line.status !== AuditLineStatus.PENDING) {
        data.status = AuditLineStatus.PENDING;
        data.auditedAmount = null;
      }
    }
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.notes !== undefined) data.notes = clean(dto.notes);
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    return this.prisma.tourAuditLine.update({ where: { id: lineId }, data });
  }

  async deleteLine(lineId: string, organizationId: string) {
    const line = await this.mustGetLine(lineId, organizationId);
    if (line.audit.status === TourAuditStatus.CLOSED)
      throw new BadRequestException('Phiếu đã khóa sổ, không xóa được');
    await this.prisma.tourAuditLine.delete({ where: { id: lineId } });
    return { deleted: true };
  }

  async transition(auditId: string, action: string, organizationId: string) {
    const audit = await this.mustGetAudit(auditId, organizationId);
    const map: Record<string, TourAuditStatus> = {
      submit: TourAuditStatus.SUBMITTED,
      review: TourAuditStatus.REVIEWED,
      approve: TourAuditStatus.APPROVED,
      close: TourAuditStatus.CLOSED,
      reopen: TourAuditStatus.OPEN,
    };
    const next = map[action];
    if (!next) throw new BadRequestException('Hành động không hợp lệ');
    if (!AUDIT_FLOW[audit.status].includes(next))
      throw new BadRequestException(`Không thể chuyển từ ${audit.status} sang ${next}`);
    const stamp: any = {};
    if (next === TourAuditStatus.SUBMITTED) stamp.submittedAt = new Date();
    if (next === TourAuditStatus.REVIEWED) stamp.reviewedAt = new Date();
    if (next === TourAuditStatus.APPROVED) stamp.approvedAt = new Date();
    if (next === TourAuditStatus.CLOSED) stamp.closedAt = new Date();
    return this.prisma.tourAudit.update({ where: { id: auditId }, data: { status: next, ...stamp } });
  }

  // Kế toán tick từng dòng
  async reviewLine(lineId: string, dto: ReviewAuditLineDto, organizationId: string, reviewer?: string) {
    const line = await this.mustGetLine(lineId, organizationId);
    if (line.audit.status === TourAuditStatus.CLOSED)
      throw new BadRequestException('Phiếu đã khóa sổ');
    if (dto.status === AuditLineStatus.ADJUSTED && dto.auditedAmount === undefined)
      throw new BadRequestException('ADJUSTED cần có auditedAmount');
    return this.prisma.tourAuditLine.update({
      where: { id: lineId },
      data: {
        status: dto.status,
        auditedAmount: dto.auditedAmount ?? (dto.status === AuditLineStatus.APPROVED ? line.claimedAmount : line.auditedAmount),
        notes: dto.notes !== undefined ? clean(dto.notes) : line.notes,
        reviewedBy: reviewer,
        reviewedAt: new Date(),
      },
    });
  }

  // Upload ảnh bill cho dòng kiểm toán
  async uploadBill(lineId: string, file: any, organizationId: string) {
    const line = await this.mustGetLine(lineId, organizationId);
    if (!file?.buffer) throw new BadRequestException('Thiếu file upload');
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException('Chỉ nhận file jpg/png/pdf');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('File tối đa 5MB');

    const dir = join(process.cwd(), 'uploads', 'audit-bills');
    await fs.mkdir(dir, { recursive: true });
    const ext = extname(file.originalname || '') || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
    const filename = `${line.auditId}_${lineId}_${Date.now()}${ext}`;
    await fs.writeFile(join(dir, filename), file.buffer);
    const billUrl = `/uploads/audit-bills/${filename}`;

    const updated = await this.prisma.tourAuditLine.update({
      where: { id: lineId }, data: { billUrl },
    });
    // Lưu vết vào TourDocument của đoàn
    await this.prisma.tourDocument.create({
      data: {
        tourId: line.audit.tourId,
        type: 'AUDIT_BILL',
        name: `Bill kiểm toán - ${line.description}`.slice(0, 200),
        fileUrl: billUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });
    return updated;
  }

  // Xuất kế hoạch đoàn (出团计划表)
  async getDeparturePlan(tourId: string, organizationId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, organizationId },
      include: {
        customer: true,
        guests: { orderBy: { sortOrder: 'asc' } },
        guideAssignments: {
          include: { guide: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        assignments: {
          where: { role: 'DRIVER' },
          include: { user: true },
          take: 1,
        },
      },
    });
    if (!tour) throw new NotFoundException('Không tìm thấy đoàn');

    const rooming: Record<string, number> = {};
    for (const g of tour.guests) {
      const key = g.roomType?.trim() || 'Chưa xếp';
      rooming[key] = (rooming[key] ?? 0) + 1;
    }

    let itineraryDays: any[] = [];
    if (tour.itineraryId) {
      const version = await this.prisma.itineraryVersion.findFirst({
        where: { itineraryId: tour.itineraryId },
        orderBy: { versionNumber: 'desc' },
        include: { days: { orderBy: { dayNumber: 'asc' } } },
      });
      if (version) itineraryDays = version.days;
    }

    const advances = await this.prisma.guideAdvance.aggregate({
      where: { tourId, organizationId, status: 'PAID' },
      _sum: { amount: true },
    });

    const guide = tour.guideAssignments[0];
    const driver = tour.assignments[0];
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    return {
      organization: organization ? {
        name: organization.name,
        address: organization.address,
        phone: organization.phone,
        taxCode: organization.taxCode,
      } : null,
      tour: {
        code: tour.code,
        title: tour.title,
        destination: tour.destination,
        travelDateFrom: tour.travelDateFrom,
        travelDateTo: tour.travelDateTo,
        pax: tour.pax,
        paxAdult: tour.paxAdult,
        paxChild: tour.paxChild,
        sellingPrice: tour.sellingPrice,
        currency: tour.currency,
        pickupLocation: tour.pickupLocation,
        pickupTime: tour.pickupTime,
        flightInfo: tour.flightInfo,
        internalNotes: tour.internalNotes,
        customer: tour.customer ? {
          name: [tour.customer.firstName, tour.customer.lastName].filter(Boolean).join(' ')
            || tour.customer.companyName || null,
        } : null,
      },
      paxCount: tour.guests.length,
      rooming,
      guide: guide ? {
        name: guide.guide.fullName,
        phone: guide.guide.phone,
        licenseNo: guide.guide.licenseNo,
        startAt: guide.startAt,
        endAt: guide.endAt,
        days: guide.days,
      } : null,
      driver: driver ? {
        name: [driver.user?.firstName, driver.user?.lastName].filter(Boolean).join(' ') || null,
        phone: driver.user?.phone ?? null,
      } : null,
      guideAdvanceTotal: advances._sum.amount ?? 0,
      itineraryDays: itineraryDays.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        description: d.description,
        meals: d.meals,
        accommodation: d.accommodation,
      })),
    };
  }

  // Quyết toán tài chính đoàn (结算单)
  async getSettlement(tourId: string, organizationId: string) {
    const tour = await this.prisma.tour.findFirst({ where: { id: tourId, organizationId } });
    if (!tour) throw new NotFoundException('Không tìm thấy đoàn');

    // Tổng thu: invoice RECEIVABLE gắn trực tiếp vào tour (tour đã org-scoped)
    const invoices = await this.prisma.invoice.findMany({
      where: { tourId, type: 'RECEIVABLE' },
    });
    // Tổng chi: sắp xếp DV (CONFIRMED/PAID) + quyết toán HDV (APPROVED/PAID) + thanh toán NCC gắn tour
    const arrangements = await this.prisma.tourServiceArrangement.findMany({
      where: { tourId, organizationId, status: { in: ['CONFIRMED', 'PAID'] } },
    });
    const guideSettlements = await this.prisma.guideSettlement.findMany({
      where: { tourId, organizationId, status: { in: ['APPROVED', 'PAID'] } },
    });
    const supplierPayments = await this.prisma.supplierPayment.findMany({
      where: { tourId },
    });

    const bucket = (rows: any[], getAmt: (r: any) => number) => {
      const m = new Map<string, number>();
      for (const r of rows) {
        const c = r.currency as string;
        m.set(c, (m.get(c) ?? 0) + getAmt(r));
      }
      return [...m.entries()].map(([currency, amount]) => ({ currency, amount }));
    };

    const revenue = bucket(invoices, (r) => N(r.totalAmount));
    const costArr = bucket(arrangements, (r) => N(r.totalAmount));
    const costGuide = bucket(guideSettlements, (r) => N(r.netPayable));
    const costSupplier = bucket(supplierPayments, (r) => N(r.amount));

    const merge = (...lists: { currency: string; amount: number }[][]) => {
      const m = new Map<string, number>();
      for (const l of lists) for (const { currency, amount } of l)
        m.set(currency, (m.get(currency) ?? 0) + amount);
      return [...m.entries()].map(([currency, amount]) => ({ currency, amount }));
    };
    const totalCost = merge(costArr, costGuide, costSupplier);
    const profit = merge(revenue).map((r) => {
      const c = totalCost.find((x) => x.currency === r.currency);
      return { currency: r.currency, amount: r.amount - (c?.amount ?? 0) };
    });

    const costByService = arrangements.reduce((acc: any[], a) => {
      const key = `${a.serviceType}|${a.currency}`;
      const found = acc.find((x) => x.key === key);
      if (found) found.amount += N(a.totalAmount);
      else acc.push({ key, serviceType: a.serviceType, currency: a.currency, amount: N(a.totalAmount) });
      return acc;
    }, []).map(({ key, ...rest }: any) => rest);

    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    return {
      organization: organization ? {
        name: organization.name, address: organization.address,
        phone: organization.phone, taxCode: organization.taxCode,
      } : null,
      tour: { code: tour.code, title: tour.title, currency: tour.currency },
      revenue,
      costs: { arrangements: costArr, guideSettlements: costGuide, supplierPayments: costSupplier, total: totalCost },
      costByService,
      profit,
      counts: {
        invoices: invoices.length,
        arrangements: arrangements.length,
        guideSettlements: guideSettlements.length,
        supplierPayments: supplierPayments.length,
      },
      notes: [
        'Tổng thu = invoice RECEIVABLE gắn trực tiếp vào đoàn.',
        'Thanh toán NCC tạo từ dòng sắp xếp trước 15/10/2026 có thể chưa gắn tourId — chi phí đó đã nằm trong sắp xếp dịch vụ.',
      ],
    };
  }
}
