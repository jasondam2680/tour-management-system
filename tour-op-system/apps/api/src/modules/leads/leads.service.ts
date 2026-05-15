import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadDto } from './dto/query-lead.dto';
import { AddActivityDto } from './dto/add-activity.dto';
import { ChangeLeadStatusDto } from './dto/change-status.dto';
import { LeadStatus } from '@prisma/client';

// Status transitions: which statuses can each status move to
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW:           ['CONTACTED', 'QUALIFIED', 'LOST', 'ABANDONED'],
  CONTACTED:     ['QUALIFIED', 'NEGOTIATING', 'LOST', 'ABANDONED'],
  QUALIFIED:     ['PROPOSAL_SENT', 'NEGOTIATING', 'LOST', 'ABANDONED'],
  PROPOSAL_SENT: ['NEGOTIATING', 'WON', 'LOST', 'ABANDONED'],
  NEGOTIATING:   ['WON', 'LOST', 'ABANDONED'],
  WON:           [],
  LOST:          ['NEW'],  // can re-open
  ABANDONED:     ['NEW'],
};

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLeadDto, organizationId: string, createdById: string) {
    return this.prisma.lead.create({
      data: {
        ...dto,
        organizationId,
        createdById,
        travelDateFrom: dto.travelDateFrom ? new Date(dto.travelDateFrom) : undefined,
        travelDateTo:   dto.travelDateTo   ? new Date(dto.travelDateTo)   : undefined,
        followUpAt:     dto.followUpAt     ? new Date(dto.followUpAt)     : undefined,
        status: dto.status ?? 'NEW',
        priority: dto.priority ?? 'MEDIUM',
      },
      include: {
        customer:   { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
        createdBy:  { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async findAll(query: QueryLeadDto, organizationId: string) {
    const {
      search, status, priority, assignedToId, customerId,
      page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const where: any = {
      organizationId,
      ...(status       && { status }),
      ...(priority     && { priority }),
      ...(assignedToId && { assignedToId }),
      ...(customerId   && { customerId }),
      ...(search && {
        OR: [
          { title:       { contains: search, mode: 'insensitive' } },
          { destination: { contains: search, mode: 'insensitive' } },
          { notes:       { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.paginate(
      this.prisma.lead,
      {
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer:   { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          _count:     { select: { activities: true, quotations: true } },
        },
      },
      page,
      limit,
    );
  }

  // Returns leads grouped by status — for Kanban view
  async findKanban(organizationId: string, assignedToId?: string) {
    const where: any = {
      organizationId,
      status: { notIn: ['WON', 'LOST', 'ABANDONED'] as any[] },
      ...(assignedToId && { assignedToId }),
    };

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer:   { select: { id: true, firstName: true, lastName: true, companyName: true, type: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        _count:     { select: { activities: true } },
      },
    });

    // Group by status
    const COLUMNS = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING'];
    const kanban: Record<string, any[]> = {};
    for (const col of COLUMNS) kanban[col] = [];
    for (const lead of leads) kanban[lead.status]?.push(lead);

    return kanban;
  }

  async findOne(id: string, organizationId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId },
      include: {
        customer:   true,
        createdBy:  { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        activities: { orderBy: { doneAt: 'desc' } },
        quotations: { select: { id: true, code: true, status: true, totalAmount: true, currency: true, createdAt: true } },
      },
    });
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        travelDateFrom: dto.travelDateFrom ? new Date(dto.travelDateFrom) : undefined,
        travelDateTo:   dto.travelDateTo   ? new Date(dto.travelDateTo)   : undefined,
        followUpAt:     dto.followUpAt     ? new Date(dto.followUpAt)     : undefined,
        wonAt:          dto.wonAt          ? new Date(dto.wonAt)          : undefined,
        lostAt:         dto.lostAt         ? new Date(dto.lostAt)         : undefined,
      },
    });
  }

  async changeStatus(id: string, dto: ChangeLeadStatusDto, organizationId: string) {
    const lead = await this.findOne(id, organizationId);
    const current = lead.status as string;
    const next = dto.status as string;

    if (!VALID_TRANSITIONS[current]?.includes(next)) {
      throw new BadRequestException(
        `Cannot move lead from ${current} to ${next}. Valid transitions: ${VALID_TRANSITIONS[current]?.join(', ')}`,
      );
    }

    if (next === 'LOST' && !dto.lostReason) {
      throw new BadRequestException('lostReason is required when marking a lead as LOST');
    }

    const data: any = {
      status: dto.status,
      ...(next === 'WON'  && { wonAt:  new Date() }),
      ...(next === 'LOST' && { lostAt: new Date(), lostReason: dto.lostReason }),
    };

    const updated = await this.prisma.lead.update({ where: { id }, data });

    // Auto-log the status change as an activity
    await this.prisma.leadActivity.create({
      data: {
        leadId:  id,
        type:    'status_change',
        content: `Status changed from ${current} to ${next}`,
        outcome: dto.lostReason,
      },
    });

    return updated;
  }

  async addActivity(id: string, dto: AddActivityDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.leadActivity.create({
      data: { leadId: id, ...dto },
    });
  }

  async getStats(organizationId: string) {
    const [byStatus, byPriority, total, wonThisMonth] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.lead.groupBy({
        by: ['priority'],
        where: { organizationId, status: { notIn: ['WON', 'LOST', 'ABANDONED'] as any } },
        _count: { _all: true },
      }),
      this.prisma.lead.count({ where: { organizationId } }),
      this.prisma.lead.count({
        where: {
          organizationId,
          status: 'WON' as any,
          wonAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);

    return { total, wonThisMonth, byStatus, byPriority };
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.lead.update({
      where: { id },
      data: { status: 'ABANDONED' as any },
    });
  }
}
