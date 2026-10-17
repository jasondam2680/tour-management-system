// apps/api/src/modules/tours/tours.cron.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service'; // Sửa đường dẫn tương đối đồng bộ
import { TourStatus } from '@prisma/client';

@Injectable()
export class ToursCronService {
  private readonly logger = new Logger(ToursCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTourStatusAutomation() {
    this.logger.log('Starting automated tour lifecycle status updates...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      await this.prisma.$transaction(async (tx) => {
        const startedTours = await tx.tour.updateMany({
          where: {
            status: TourStatus.CONFIRMED,
            travelDateFrom: { lte: today },
          },
          data: {
            status: TourStatus.IN_PROGRESS,
            startedAt: new Date(),
          },
        });
        if (startedTours.count > 0) {
          this.logger.log(`Automated Engine: Activated ${startedTours.count} tours to IN_PROGRESS.`);
        }

        const completedTours = await tx.tour.updateMany({
          where: {
            status: TourStatus.IN_PROGRESS,
            travelDateTo: { lt: today },
          },
          data: {
            status: TourStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        if (completedTours.count > 0) {
          this.logger.log(`Automated Engine: Completed ${completedTours.count} operational tours.`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to update automated tour statuses:', error.stack);
    }
  }
}