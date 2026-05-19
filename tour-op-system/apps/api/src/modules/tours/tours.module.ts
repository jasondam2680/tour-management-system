import { Module } from '@nestjs/common';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TourAutomationService } from './tour-automation.service';
import { TourCalculationService } from './tour-calculation.service';

@Module({
  controllers: [ToursController],
  providers: [ToursService, PrismaService, TourAutomationService, TourCalculationService,],
  exports: [ToursService],
})
export class ToursModule {}
