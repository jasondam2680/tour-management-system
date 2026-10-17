// apps/api/src/modules/service-arrangements/service-arrangements.module.ts
import { Module } from '@nestjs/common';
import {
  TourServicesController,
  ServiceArrangementsController,
  TourGuestsController,
} from './service-arrangements.controller';
import { ServiceArrangementsService } from './service-arrangements.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TourServicesController, ServiceArrangementsController, TourGuestsController],
  providers: [ServiceArrangementsService, PrismaService],
  exports: [ServiceArrangementsService],
})
export class ServiceArrangementsModule {}
