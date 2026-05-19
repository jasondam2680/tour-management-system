import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TourCalculationService {
  private readonly logger = new Logger(TourCalculationService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('booking.changed')
  async handleBookingChanged(payload: { tourId: string }) {
    this.logger.log(`Phát hiện Booking thay đổi. Đang tính lại chi phí Tour: ${payload.tourId}`);
    await this.recalculateTourFinancials(payload.tourId);
  }

  @OnEvent('tour.price_updated')
  async handleTourPriceUpdated(payload: { tourId: string }) {
    this.logger.log(`Giá bán thay đổi. Đang tính lại lợi nhuận Tour: ${payload.tourId}`);
    await this.recalculateTourFinancials(payload.tourId);
  }

  public async recalculateTourFinancials(tourId: string) {
    try {
      const tour = await this.prisma.tour.findUnique({
        where: { id: tourId },
        select: { sellingPrice: true }
      });

      if (!tour) return;

      // Cộng dồn toàn bộ totalCostBase của các booking (trừ các booking đã huỷ)
      const validBookings = await this.prisma.booking.findMany({
        where: { tourId: tourId, status: { not: 'CANCELLED' } },
        select: { totalCostBase: true },
      });

      const totalCost = validBookings.reduce((sum, booking) => {
        return sum + Number(booking.totalCostBase || 0);
      }, 0);

      const sellingPrice = Number(tour.sellingPrice || 0);
      const profitAmount = sellingPrice - totalCost;
      let profitMargin = sellingPrice > 0 ? (profitAmount / sellingPrice) * 100 : 0;

      await this.prisma.tour.update({
        where: { id: tourId },
        data: {
          totalCost: totalCost,
          profitAmount: profitAmount,
          profitMargin: profitMargin,
        },
      });

      this.logger.log(`Tính toán xong Tour ${tourId}: Cost=${totalCost}, Profit=${profitAmount}`);
    } catch (error) {
      this.logger.error(`Lỗi tính toán tài chính Tour ${tourId}`, error);
    }
  }
}