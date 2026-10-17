// apps/api/src/modules/suppliers/suppliers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, SupplierCategory } from '@prisma/client';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateResourceDto, UpdateResourceDto } from './dto/resource.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // HELPER METHODS
  // ===========================================================================
  
  private async generateCode(organizationId: string, category: SupplierCategory) {
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'SUP';
    const count = await this.prisma.supplier.count({
      where: { organizationId, category },
    });
    // FIX: Sửa lỗi chính tả totring -> toString()
    return `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
  }

  private async ensureSupplierExists(supplierId: string, organizationId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, organizationId },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${supplierId} not found`);
    return supplier;
  }

  // ===========================================================================
  // SUPPLIER CORE METHODS
  // ===========================================================================

  async create(dto: CreateSupplierDto, organizationId: string) {
    const code = await this.generateCode(organizationId, dto.category);
    
    // FIX: Đã dọn dẹp sạch sẽ các biến page, limit, category bị thừa ở đây
    return this.prisma.supplier.create({
      data: {
        ...dto,
        code,
        organizationId,
      },
    });
  }
    
  async findAll(query: QuerySupplierDto, organizationId: string) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 100;
    const skip = (page - 1) * limit;

    // Khởi tạo điều kiện WHERE an toàn với kiểu của Prisma
    const where: Prisma.SupplierWhereInput = {
      organizationId,
    };

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    
    if (query.isPreferred !== undefined) {
      where.isPreferred = query.isPreferred;
    }

    if (query.category) {
      const categoryUpper = query.category.toUpperCase();
      if (Object.values(SupplierCategory).includes(categoryUpper as any)) {
        where.category = categoryUpper as SupplierCategory;
      }
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        include: {
          resources: true,
          _count: {
            select: { resources: true, bookings: true },
          },
        },
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(organizationId: string) {
    const total = await this.prisma.supplier.count({ where: { organizationId } });
    const active = await this.prisma.supplier.count({
      where: { organizationId, isActive: true },
    });
    return {
      total,
      active,
      inactive: total - active,
    };
  }

  async findOne(id: string, organizationId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId },
      include: {
        resources: true,
      },
    });
    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, organizationId: string) {
    await this.ensureSupplierExists(id, organizationId);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.ensureSupplierExists(id, organizationId);
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ===========================================================================
  // RESOURCE METHODS
  // ===========================================================================

  async createResource(supplierId: string, dto: CreateResourceDto, organizationId: string) {
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

  async findResource(supplierId: string, resourceId: string, organizationId: string) {
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

  async removeResource(supplierId: string, resourceId: string, organizationId: string) {
    await this.findResource(supplierId, resourceId, organizationId);
    return this.prisma.resource.update({
      where: { id: resourceId },
      data: { isActive: false },
    });
  }
}