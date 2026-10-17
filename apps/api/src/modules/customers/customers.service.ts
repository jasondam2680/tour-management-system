import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { CustomerType } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto, organizationId: string) {
    // Validate B2B/B2C required fields
    if (dto.type === CustomerType.B2B && !dto.companyName) {
      throw new BadRequestException('Company name is required for B2B customers');
    }
    if (dto.type === CustomerType.B2C && !dto.firstName && !dto.lastName) {
      throw new BadRequestException('First name or last name is required for B2C customers');
    }

    const code = await this.generateCode(organizationId, dto.type);

    return this.prisma.customer.create({
      data: {
        ...dto,
        code,
        organizationId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async findAll(query: QueryCustomerDto, organizationId: string) {
    const {
      search, type, country, isVip, isActive = true,
      page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc',
    } = query;

    const where: any = {
      organizationId,
      ...(isActive !== undefined && { isActive }),
      ...(type && { type }),
      ...(country && { country }),
      ...(isVip !== undefined && { isVip }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return this.prisma.paginate(
      this.prisma.customer,
      {
        where,
        orderBy: { [sortBy]: sortOrder },
        include: { contacts: true },
      },
      page,
      limit,
    );
  }

  async findOne(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        contacts: true,
        _count: {
          select: { leads: true, quotations: true, tours: true },
        },
      },
    });
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, organizationId: string) {
    await this.findOne(id, organizationId); // throws if not found

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    // Soft delete
    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(organizationId: string) {
    const [total, b2b, b2c, vip] = await Promise.all([
      this.prisma.customer.count({ where: { organizationId, isActive: true } }),
      this.prisma.customer.count({ where: { organizationId, type: 'B2B', isActive: true } }),
      this.prisma.customer.count({ where: { organizationId, type: 'B2C', isActive: true } }),
      this.prisma.customer.count({ where: { organizationId, isVip: true, isActive: true } }),
    ]);

    return { total, b2b, b2c, vip };
  }

  // Generate customer code: B2B-2024-0001 or B2C-2024-0001
  private async generateCode(organizationId: string, type: CustomerType): Promise<string> {
    const prefix = type === CustomerType.B2B ? 'B2B' : 'B2C';
    const year = new Date().getFullYear();

    const lastCustomer = await this.prisma.customer.findFirst({
      where: {
        organizationId,
        code: { startsWith: `${prefix}-${year}` },
      },
      orderBy: { code: 'desc' },
    });

    let seq = 1;
    if (lastCustomer?.code) {
      const parts = lastCustomer.code.split('-');
      seq = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}-${year}-${String(seq).padStart(4, '0')}`;
  }
}
