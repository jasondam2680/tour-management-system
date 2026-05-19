import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { TourStatus } from '@prisma/client';

@Injectable()
export class TourAutomationService {
  private readonly logger = new Logger(TourAutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chạy vào lúc 00:01 mỗi ngày
   * Tự động chuyển Tour từ CONFIRMED -> IN_PROGRESS nếu đến ngày đi
   */
  @Cron('1 0 * * *') 
  async autoStartTours() {
    this.logger.log('Bắt đầu tiến trình tự động khởi hành Tour (autoStartTours)...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      const result = await this.prisma.tour.updateMany({
        where: {
          status: TourStatus.CONFIRMED,
          travelDateFrom: { lte: today },
        },
        data: {
          status: TourStatus.IN_PROGRESS,
          startedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.log(`Đã chuyển ${result.count} tours sang ĐANG DIỄN RA.`);
      }
    } catch (error) {
      this.logger.error('Lỗi khi chạy autoStartTours', error);
    }
  }

  /**
   * Chạy vào lúc 23:50 mỗi ngày
   * Tự động chuyển Tour từ IN_PROGRESS -> COMPLETED nếu qua ngày về
   */
  @Cron('50 23 * * *')
  async autoCompleteTours() {
    this.logger.log('Bắt đầu tiến trình tự động hoàn thành Tour (autoCompleteTours)...');
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    try {
      const result = await this.prisma.tour.updateMany({
        where: {
          status: TourStatus.IN_PROGRESS,
          travelDateTo: { lt: today },
        },
        data: {
          status: TourStatus.COMPLETED,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      if (result.count > 0) {
        this.logger.log(`Đã chuyển ${result.count} tours sang HOÀN THÀNH.`);
      }
    } catch (error) {
      this.logger.error('Lỗi khi chạy autoCompleteTours', error);
    }
  }
}