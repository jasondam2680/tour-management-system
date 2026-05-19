import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Currency } from '@prisma/client';
@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, data: CreateInvoiceDto) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: data.tourId, organizationId }
    });

    if (!tour) {
      throw new NotFoundException(`Không tìm thấy Tour với ID ${data.tourId}`);
    }

    const code = await this.generateCode(organizationId);

    const invoice = await this.prisma.invoice.create({
      data: {
        code,
        tourId: data.tourId,
        customerId: data.customerId,
        totalAmount: data.totalAmount,
        amountDue: data.totalAmount,
        currency: data.currency as Currency,
        status: 'UNPAID',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        notes: data.notes,
      }
    });

    return invoice;
  }

  private async generateCode(organizationId: string): Promise<string> {
    const count = await this.prisma.invoice.count({
      where: { tour: { organizationId } }
    });
    const prefix = 'INV';
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
    const sequence = String(count + 1).padStart(4, '0');
    return `${prefix}${dateStr}-${sequence}`;
  }
}