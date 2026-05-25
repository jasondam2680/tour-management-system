// apps/api/src/modules/tours/tours.macro.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Sửa đường dẫn tương đối đồng bộ
import { TourStatus } from '@prisma/client';

@Injectable()
export class ToursMacroService {
  constructor(private readonly prisma: PrismaService) {}

  async recalculateTourFinance(tourId: string): Promise<void> {
    const tour = await this.prisma.tour.findUnique({
      where: { id: tourId },
      include: { bookings: true },
    });

    if (!tour) {
      throw new NotFoundException(`Tour with ID ${tourId} not found`);
    }

    let totalCostBase = 0;
    for (const booking of tour.bookings) {
      if (booking.status !== 'CANCELLED') {
        const cost = booking.totalCostBase 
          ? Number(booking.totalCostBase) 
          : Number(booking.totalCost);
        totalCostBase += cost;
      }
    }

    const sellingPrice = Number(tour.sellingPrice);
    const profitAmount = sellingPrice - totalCostBase;
    const profitMargin = sellingPrice > 0 
      ? Number(((profitAmount / sellingPrice) * 100).toFixed(2)) 
      : 0;

    await this.prisma.tour.update({
      where: { id: tourId },
      data: {
        totalCost: totalCostBase,
        profitAmount: profitAmount,
        profitMargin: profitMargin,
      },
    });
  }

  async cancelTourWithRefundRules(tourId: string, reason: string): Promise<void> {
    const tour = await this.prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw new NotFoundException('Tour record does not exist.');

    await this.prisma.$transaction(async (tx) => {
      await tx.tour.update({
        where: { id: tourId },
        data: {
          status: TourStatus.CANCELLED,
          cancelReason: reason,
          cancelledAt: new Date(),
        },
      });

      await tx.booking.updateMany({
        where: { tourId: tourId, status: { not: 'CANCELLED' } },
        data: {
          status: 'CANCELLED',
          internalNotes: `Auto-cancelled due to Master Tour cancellation. Reason: ${reason}`,
        },
      });
    });
  }
}