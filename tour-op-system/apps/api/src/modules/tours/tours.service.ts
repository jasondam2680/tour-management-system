import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TourStatus } from '@prisma/client';
import { CreateTourDto } from './dto/create-tour.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { QueryTourDto } from './dto/query-tour.dto';
import { ChangeTourStatusDto } from './dto/change-status.dto';
import { AddAssignmentDto } from './dto/add-assignment.dto';
import { AddIncidentDto } from './dto/add-incident.dto';

@Injectable()
export class ToursService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, query: QueryTourDto) {
    const { search, status, customerId, dateFrom, dateTo, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (dateFrom || dateTo) {
      where.travelDateFrom = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.tour.findMany({
        where, skip, take: limit,
        orderBy: { travelDateFrom: 'asc' },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
          assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } },
          _count: { select: { bookings: true, invoices: true } },
        },
      }),
      this.prisma.tour.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, organizationId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        quotation: { select: { id: true, code: true, title: true, totalAmount: true, currency: true } },
        assignments: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true, phone: true } } } },
        bookings: { include: { supplier: { select: { id: true, name: true, category: true } } }, orderBy: { serviceDate: 'asc' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        incidents: { orderBy: { occurredAt: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
      },
    });
    if (!tour) throw new NotFoundException(`Tour ${id} not found`);
    return tour;
  }

  async create(organizationId: string, dto: CreateTourDto) {
    const code = await this.generateCode(organizationId);
    let quotationSnapshot: any = {};

    if (dto.quotationId) {
      const quotation = await this.prisma.quotation.findUnique({ where: { id: dto.quotationId } });
      if (!quotation) throw new NotFoundException('Quotation not found');
      if (quotation.organizationId !== organizationId) throw new BadRequestException('Quotation does not belong to this organization');

      quotationSnapshot = {
        customerId: dto.customerId ?? quotation.customerId,
        sellingPrice: quotation.totalAmount,
        totalCost: quotation.totalCost,
        profitAmount: quotation.profitAmount,
        profitMargin: quotation.profitMargin,
        currency: quotation.currency,
      };

      await this.prisma.quotation.update({ where: { id: dto.quotationId }, data: { status: 'CONVERTED' } });
    }

    return this.prisma.tour.create({
      data: {
        organizationId, code,
        ...quotationSnapshot, ...dto,
        paxChild: dto.paxChild ?? 0,
        travelDateFrom: new Date(dto.travelDateFrom),
        travelDateTo: new Date(dto.travelDateTo),
      },
    });
  }

  async update(id: string, organizationId: string, dto: UpdateTourDto) {
    await this.findOne(id, organizationId);
    return this.prisma.tour.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.travelDateFrom && { travelDateFrom: new Date(dto.travelDateFrom) }),
        ...(dto.travelDateTo && { travelDateTo: new Date(dto.travelDateTo) }),
      },
    });
  }

  async changeStatus(id: string, organizationId: string, dto: ChangeTourStatusDto) {
    const tour = await this.findOne(id, organizationId);
    const { status, reason } = dto;

    const validTransitions: Record<TourStatus, TourStatus[]> = {
      PLANNING:    [TourStatus.CONFIRMED, TourStatus.CANCELLED],
      CONFIRMED:   [TourStatus.IN_PROGRESS, TourStatus.CANCELLED],
      IN_PROGRESS: [TourStatus.COMPLETED, TourStatus.CANCELLED],
      COMPLETED:   [],
      CANCELLED:   [],
    };

    if (!validTransitions[tour.status].includes(status)) {
      throw new BadRequestException(`Không thể chuyển trạng thái từ ${tour.status} sang ${status}`);
    }
    if (status === TourStatus.CANCELLED && !reason) {
      throw new BadRequestException('Cần nhập lý do khi huỷ tour');
    }

    const timestamps: any = {};
    if (status === TourStatus.CONFIRMED)   timestamps.confirmedAt  = new Date();
    if (status === TourStatus.IN_PROGRESS) timestamps.startedAt    = new Date();
    if (status === TourStatus.COMPLETED)   timestamps.completedAt  = new Date();
    if (status === TourStatus.CANCELLED) { timestamps.cancelledAt  = new Date(); timestamps.cancelReason = reason; }

    return this.prisma.tour.update({ where: { id }, data: { status, ...timestamps } });
  }

  async addAssignment(tourId: string, organizationId: string, dto: AddAssignmentDto) {
    await this.findOne(tourId, organizationId);
    return this.prisma.tourAssignment.create({
      data: { tourId, ...dto },
      include: { user: { select: { id: true, firstName: true, lastName: true, role: true } } },
    });
  }

  async removeAssignment(tourId: string, assignmentId: string, organizationId: string) {
    await this.findOne(tourId, organizationId);
    return this.prisma.tourAssignment.delete({ where: { id: assignmentId } });
  }

  async addIncident(tourId: string, organizationId: string, dto: AddIncidentDto) {
    await this.findOne(tourId, organizationId);
    return this.prisma.tourIncident.create({ data: { tourId, ...dto } });
  }

  async getStats(organizationId: string) {
    const now = new Date();
    const [total, byStatus, upcoming, financial] = await Promise.all([
      this.prisma.tour.count({ where: { organizationId } }),
      this.prisma.tour.groupBy({ by: ['status'], where: { organizationId }, _count: true }),
      this.prisma.tour.count({
        where: { organizationId, status: { in: [TourStatus.PLANNING, TourStatus.CONFIRMED] }, travelDateFrom: { gte: now } },
      }),
      this.prisma.tour.aggregate({
        where: { organizationId, status: TourStatus.COMPLETED },
        _sum: { sellingPrice: true, profitAmount: true },
      }),
    ]);

    return {
      total, upcoming,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      totalRevenue: Number(financial._sum.sellingPrice ?? 0),
      totalProfit:  Number(financial._sum.profitAmount ?? 0),
    };
  }

  private async generateCode(organizationId: string): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await this.prisma.tour.count({ where: { organizationId } });
    return `TOU-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}
