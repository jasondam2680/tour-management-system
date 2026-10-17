import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, PaginatedResult } from '../../prisma/prisma.service';
import { CreateGroupTourTemplateDto } from './dto/create-group-tour-template.dto';
import { UpdateGroupTourTemplateDto } from './dto/update-group-tour-template.dto';
import { QueryGroupTourTemplateDto } from './dto/query-group-tour-template.dto';

@Injectable()
export class GroupToursService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `GRP-${year}`;
    const count = await this.prisma.itinerary.count({
      where: { organizationId, isTemplate: true, code: { startsWith: prefix } },
    });
    const num = String(count + 1).padStart(4, '0');
    return `${prefix}-${num}`;
  }

  async create(organizationId: string, dto: CreateGroupTourTemplateDto) {
    const code = await this.generateCode(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const itinerary = await tx.itinerary.create({
        data: {
          organizationId,
          code,
          title: dto.title,
          isTemplate: true,
          templateName: dto.templateName,
          duration: dto.duration,
          minPax: dto.minPax,
          packagePrice: dto.packagePrice,
          packagePriceCurrency: dto.packagePriceCurrency || 'USD',
          packageIncludes: dto.packageIncludes,
          isActive: true,
        },
      });

      const days = dto.days || [];
      if (days.length > 0) {
        const version = await tx.itineraryVersion.create({
          data: {
            itineraryId: itinerary.id,
            versionNumber: 1,
            title: dto.title,
            overview: dto.overview,
            notes: dto.notes,
            isActive: true,
            days: {
              create: days.map((d) => ({
                dayNumber: d.dayNumber,
                title: d.title,
                description: d.description,
                meals: d.meals || [],
                accommodation: d.accommodation,
                activities: {
                  create: (d.activities || []).map((a) => ({
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
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                activities: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        });

        await tx.itinerary.update({
          where: { id: itinerary.id },
          data: { currentVersionId: version.id },
        });

        return { ...itinerary, currentVersion: version };
      }

      return itinerary;
    });
  }

  async findAll(
    organizationId: string,
    query: QueryGroupTourTemplateDto,
  ): Promise<PaginatedResult<any>> {
    const { search, isActive, page = 1, limit = 20 } = query;
    const where: any = {
      organizationId,
      isTemplate: true,
      ...(isActive !== undefined && { isActive }),
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { templateName: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.paginate(
      this.prisma.itinerary,
      {
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          currentVersion: {
            select: {
              id: true,
              versionNumber: true,
              title: true,
              overview: true,
            },
          },
        },
      },
      page,
      limit,
    );
  }

  async findOne(id: string, organizationId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, organizationId, isTemplate: true },
      include: {
        currentVersion: {
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                activities: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          select: {
            id: true,
            versionNumber: true,
            title: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!itinerary) {
      throw new NotFoundException(`Group Tour Template ${id} not found`);
    }

    return itinerary;
  }

  async update(id: string, organizationId: string, dto: UpdateGroupTourTemplateDto) {
    const existing = await this.prisma.itinerary.findFirst({
      where: { id, organizationId, isTemplate: true },
    });

    if (!existing) {
      throw new NotFoundException(`Group Tour Template ${id} not found`);
    }

    const { days, ...itineraryData } = dto;

    return this.prisma.$transaction(async (tx) => {
      let updated = await tx.itinerary.update({
        where: { id },
        data: itineraryData,
        include: {
          currentVersion: {
            include: {
              days: {
                orderBy: { dayNumber: 'asc' },
                include: {
                  activities: { orderBy: { sortOrder: 'asc' } },
                },
              },
            },
          },
        },
      });

      if (days && days.length > 0 && existing.currentVersionId) {
        await tx.itineraryActivity.deleteMany({
          where: { day: { versionId: existing.currentVersionId } },
        });
        await tx.itineraryDay.deleteMany({ where: { versionId: existing.currentVersionId } });

        await tx.itineraryVersion.update({
          where: { id: existing.currentVersionId },
          data: {
            days: {
              create: days.map((d) => ({
                dayNumber: d.dayNumber,
                title: d.title,
                description: d.description,
                meals: d.meals || [],
                accommodation: d.accommodation,
                activities: {
                  create: (d.activities || []).map((a) => ({
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

        updated = (await tx.itinerary.findUnique({
          where: { id },
          include: {
            currentVersion: {
              include: {
                days: {
                  orderBy: { dayNumber: 'asc' },
                  include: {
                    activities: { orderBy: { sortOrder: 'asc' } },
                  },
                },
              },
            },
          },
        }))!;
      }

      return updated;
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.itinerary.findFirst({
      where: { id, organizationId, isTemplate: true },
    });

    if (!existing) {
      throw new NotFoundException(`Group Tour Template ${id} not found`);
    }

    return this.prisma.itinerary.delete({ where: { id } });
  }

  async addDay(itineraryId: string, organizationId: string, dayData: any) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId, isTemplate: true },
      include: { currentVersion: true },
    });

    if (!itinerary || !itinerary.currentVersion) {
      throw new NotFoundException(`Template or version not found`);
    }

    return this.prisma.itineraryDay.create({
      data: {
        versionId: itinerary.currentVersion.id,
        dayNumber: dayData.dayNumber,
        title: dayData.title,
        description: dayData.description,
        meals: dayData.meals || [],
        accommodation: dayData.accommodation,
      },
      include: {
        activities: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async updateDay(itineraryId: string, dayId: string, organizationId: string, dayData: any) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId, isTemplate: true },
      include: { currentVersion: true },
    });

    if (!itinerary || !itinerary.currentVersion) {
      throw new NotFoundException(`Template or version not found`);
    }

    const day = await this.prisma.itineraryDay.findFirst({
      where: { id: dayId, versionId: itinerary.currentVersion.id },
    });

    if (!day) {
      throw new NotFoundException(`Day not found`);
    }

    return this.prisma.itineraryDay.update({
      where: { id: dayId },
      data: {
        dayNumber: dayData.dayNumber,
        title: dayData.title,
        description: dayData.description,
        meals: dayData.meals,
        accommodation: dayData.accommodation,
      },
      include: {
        activities: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async removeDay(itineraryId: string, dayId: string, organizationId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId, isTemplate: true },
      include: { currentVersion: true },
    });

    if (!itinerary || !itinerary.currentVersion) {
      throw new NotFoundException(`Template or version not found`);
    }

    return this.prisma.itineraryDay.delete({ where: { id: dayId } });
  }

  async addActivity(itineraryId: string, dayId: string, organizationId: string, activityData: any) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId, isTemplate: true },
      include: { currentVersion: true },
    });

    if (!itinerary || !itinerary.currentVersion) {
      throw new NotFoundException(`Template or version not found`);
    }

    const day = await this.prisma.itineraryDay.findFirst({
      where: { id: dayId, versionId: itinerary.currentVersion.id },
    });

    if (!day) {
      throw new NotFoundException(`Day not found`);
    }

    return this.prisma.itineraryActivity.create({
      data: {
        dayId,
        sortOrder: activityData.sortOrder ?? 0,
        time: activityData.time,
        title: activityData.title,
        description: activityData.description,
        location: activityData.location,
        duration: activityData.duration,
        notes: activityData.notes,
      },
    });
  }

  async updateActivity(
    itineraryId: string,
    dayId: string,
    activityId: string,
    organizationId: string,
    activityData: any,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId, isTemplate: true },
      include: { currentVersion: true },
    });

    if (!itinerary || !itinerary.currentVersion) {
      throw new NotFoundException(`Template or version not found`);
    }

    const activity = await this.prisma.itineraryActivity.findFirst({
      where: { id: activityId, dayId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity not found`);
    }

    return this.prisma.itineraryActivity.update({
      where: { id: activityId },
      data: {
        sortOrder: activityData.sortOrder,
        time: activityData.time,
        title: activityData.title,
        description: activityData.description,
        location: activityData.location,
        duration: activityData.duration,
        notes: activityData.notes,
      },
    });
  }

  async removeActivity(
    itineraryId: string,
    dayId: string,
    activityId: string,
    organizationId: string,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId, isTemplate: true },
      include: { currentVersion: true },
    });

    if (!itinerary || !itinerary.currentVersion) {
      throw new NotFoundException(`Template or version not found`);
    }

    return this.prisma.itineraryActivity.delete({ where: { id: activityId } });
  }

  async copyTemplateToVersion(templateId: string, organizationId: string): Promise<any> {
    const template = await this.prisma.itinerary.findFirst({
      where: { id: templateId, organizationId, isTemplate: true },
      include: {
        currentVersion: {
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                activities: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!template || !template.currentVersion) {
      throw new NotFoundException(`Template not found or has no itinerary`);
    }

    return {
      template,
      version: template.currentVersion,
    };
  }
}
