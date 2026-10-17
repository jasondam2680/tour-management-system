import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService, PaginatedResult } from '../../prisma/prisma.service';
import { CreateItineraryDto } from './dto/create-itinerary.dto';
import { UpdateItineraryDto } from './dto/update-itinerary.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { QueryItineraryDto } from './dto/query-itinerary.dto';

@Injectable()
export class ItinerariesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateCode(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ITN-${year}`;
    const count = await this.prisma.itinerary.count({
      where: { organizationId, code: { startsWith: prefix } },
    });
    const num = String(count + 1).padStart(4, '0');
    return `${prefix}-${num}`;
  }

  async create(organizationId: string, dto: CreateItineraryDto) {
    const code = await this.generateCode(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const itinerary = await tx.itinerary.create({
        data: {
          organizationId,
          code,
          title: dto.title,
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

  async findAll(organizationId: string, query: QueryItineraryDto): Promise<PaginatedResult<any>> {
    const { search, page = 1, limit = 20 } = query;
    const where: any = { organizationId };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
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
            },
          },
          _count: {
            select: { versions: true },
          },
        },
      },
      page,
      limit,
    );
  }

  async findOne(id: string, organizationId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, organizationId },
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
      throw new NotFoundException(`Itinerary ${id} not found`);
    }

    return itinerary;
  }

  async update(id: string, organizationId: string, dto: UpdateItineraryDto) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, organizationId },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerary ${id} not found`);
    }

    return this.prisma.itinerary.update({
      where: { id },
      data: {
        title: dto.title,
      },
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
  }

  async remove(id: string, organizationId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id, organizationId },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerary ${id} not found`);
    }

    return this.prisma.itinerary.delete({ where: { id } });
  }

  async createVersion(itineraryId: string, organizationId: string, dto: CreateVersionDto) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId },
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

    if (!itinerary) {
      throw new NotFoundException(`Itinerary ${itineraryId} not found`);
    }

    if (!itinerary.currentVersion) {
      throw new BadRequestException('Itinerary has no versions to base new version on');
    }

    const currentVersion = itinerary.currentVersion;

    const maxVersion = await this.prisma.itineraryVersion.findFirst({
      where: { itineraryId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    const newVersionNumber = (maxVersion?.versionNumber || 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      const newVersion = await tx.itineraryVersion.create({
        data: {
          itineraryId,
          versionNumber: newVersionNumber,
          title: dto.title || currentVersion.title,
          overview: dto.overview ?? currentVersion.overview,
          notes: dto.notes ?? currentVersion.notes,
          isActive: true,
          days: dto.days
            ? {
                create: dto.days.map((d) => ({
                  dayNumber: d.dayNumber,
                  title: d.title,
                  description: d.description,
                  meals: d.meals || [],
                  accommodation: d.accommodation,
                  activities: {
                    create: (d.activities || []).map((a) => ({
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
              }
            : {
                create: currentVersion.days.map((day) => ({
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
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              activities: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      await tx.itineraryVersion.updateMany({
        where: { itineraryId },
        data: { isActive: false },
      });

      await tx.itineraryVersion.update({
        where: { id: newVersion.id },
        data: { isActive: true },
      });

      await tx.itinerary.update({
        where: { id: itineraryId },
        data: { currentVersionId: newVersion.id },
      });

      return newVersion;
    });
  }

  async getVersions(itineraryId: string, organizationId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerary ${itineraryId} not found`);
    }

    return this.prisma.itineraryVersion.findMany({
      where: { itineraryId },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        title: true,
        overview: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { days: true },
        },
      },
    });
  }

  async getVersion(itineraryId: string, versionId: string, organizationId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerary ${itineraryId} not found`);
    }

    const version = await this.prisma.itineraryVersion.findFirst({
      where: { id: versionId, itineraryId },
      include: {
        days: {
          orderBy: { dayNumber: 'asc' },
          include: {
            activities: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    return version;
  }

  async updateVersion(
    itineraryId: string,
    versionId: string,
    organizationId: string,
    dto: UpdateVersionDto,
  ) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerary ${itineraryId} not found`);
    }

    const version = await this.prisma.itineraryVersion.findFirst({
      where: { id: versionId, itineraryId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    if (version.isActive) {
      throw new BadRequestException('Cannot update an active version. Create a new version instead.');
    }

    const { days, ...versionData } = dto;

    return this.prisma.$transaction(async (tx) => {
      let updated = await tx.itineraryVersion.update({
        where: { id: versionId },
        data: versionData,
        include: {
          days: {
            orderBy: { dayNumber: 'asc' },
            include: {
              activities: { orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      });

      if (days && days.length > 0) {
        await tx.itineraryActivity.deleteMany({
          where: {
            day: {
              versionId,
            },
          },
        });

        await tx.itineraryDay.deleteMany({
          where: { versionId },
        });

        await tx.itineraryVersion.update({
          where: { id: versionId },
          data: {
            days: {
              create: days.map((d) => ({
                dayNumber: d.dayNumber!,
                title: d.title,
                description: d.description,
                meals: d.meals || [],
                accommodation: d.accommodation,
                activities: {
                  create: (d.activities || []).map((a) => ({
                    sortOrder: a.sortOrder ?? 0,
                    time: a.time,
                    title: a.title!,
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

        updated = (await tx.itineraryVersion.findUnique({
          where: { id: versionId },
          include: {
            days: {
              orderBy: { dayNumber: 'asc' },
              include: {
                activities: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        }))!;
      }

      return updated;
    });
  }

  async activateVersion(itineraryId: string, versionId: string, organizationId: string) {
    const itinerary = await this.prisma.itinerary.findFirst({
      where: { id: itineraryId, organizationId },
    });

    if (!itinerary) {
      throw new NotFoundException(`Itinerary ${itineraryId} not found`);
    }

    const version = await this.prisma.itineraryVersion.findFirst({
      where: { id: versionId, itineraryId },
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.itineraryVersion.updateMany({
        where: { itineraryId },
        data: { isActive: false },
      });

      await tx.itineraryVersion.update({
        where: { id: versionId },
        data: { isActive: true },
      });

      return tx.itinerary.update({
        where: { id: itineraryId },
        data: { currentVersionId: versionId },
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
    });
  }
}
