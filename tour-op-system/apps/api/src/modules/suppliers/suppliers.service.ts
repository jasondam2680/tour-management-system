import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';



@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto, organizationId: string) {
    const code = await this.generateCode(organizationId, dto.category);

    return this.prisma.supplier.create({
      data: { ...dto, code, organizationId },
    });
  }

  async findAll(query: QuerySupplierDto, organizationId: string) {
    const {
      search, category, city, country, isPreferred, isActive = true,
      page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc',
    } = query;

    const where: any = {
      organizationId,
      ...(isActive !== undefined && { isActive }),
      ...(category && { category }),
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(country && { country }),
      ...(isPreferred !== undefined && { isPreferred }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { contactPerson: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.paginate(
      this.prisma.supplier,
      {
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { resources: true, bookings: true } },
        },
      },
      page,
      limit,
    );
  }

  async findOne(id: string, organizationId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId },
      include: {
        resources: { where: { isActive: true } },
        _count: { select: { bookings: true } },
      },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(organizationId: string) {
    const [total, preferred, byCategory] = await Promise.all([
      this.prisma.supplier.count({ where: { organizationId, isActive: true } }),
      this.prisma.supplier.count({ where: { organizationId, isPreferred: true, isActive: true } }),
      this.prisma.supplier.groupBy({
        by: ['category'],
        where: { organizationId, isActive: true },
        _count: true,
      }),
    ]);
    return { total, preferred, byCategory };
  }

  private async generateCode(organizationId: string, category: string): Promise<string> {
    const prefix = category.substring(0, 3).toUpperCase(); // HOT, RES, TRA, etc.
    const year = new Date().getFullYear();

    const last = await this.prisma.supplier.findFirst({
      where: { organizationId, code: { startsWith: `${prefix}-${year}` } },
      orderBy: { code: 'desc' },
    });

    let seq = 1;
    if (last?.code) {
      const parts = last.code.split('-');
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
  }

  private async ensureSupplierExists(supplierId: string, organizationId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId, isActive: true },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);
    return supplier;
  }

  async createResource(
    supplierId: string,
    dto: CreateResourceDto,
    organizationId: string,
  ) {
    await this.ensureSupplierExists(supplierId, organizationId);

    return this.prisma.resource.create({
      data: {
        ...dto,
        supplierId,
      },
    });
  }

  async findResources(supplierId: string, organizationId: string) {
    await this.ensureSupplierExists(supplierId, organizationId);

    return this.prisma.resource.findMany({
      where: { supplierId, isActive: true },
    });
  }

  async findResource(
    supplierId: string,
    resourceId: string,
    organizationId: string,
  ) {
    await this.ensureSupplierExists(supplierId, organizationId);

    const resource = await this.prisma.resource.findFirst({
      where: {
        id: resourceId,
        supplierId,
        isActive: true,
      },
    });
    if (!resource) throw new NotFoundException(`Resource ${resourceId} not found`);
    return resource;
  }

  async updateResource(
    supplierId: string,
    resourceId: string,
    dto: UpdateResourceDto,
    organizationId: string,
  ) {
    await this.findResource(supplierId, resourceId, organizationId);

    return this.prisma.resource.update({
      where: { id: resourceId },
      data: dto,
    });
  }

  async removeResource(
    supplierId: string,
    resourceId: string,
    organizationId: string,
  ) {
    await this.findResource(supplierId, resourceId, organizationId);

    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { isActive: false },
    });
  }
}

