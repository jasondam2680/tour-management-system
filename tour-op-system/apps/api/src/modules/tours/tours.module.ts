// apps/api/src/modules/tours/tours.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';
import { ToursMacroService } from './tours.macro.service';
import { TourDocumentsService } from './tour-documents.service'; // Khai báo import service tài liệu mới
import { ToursCronService } from './tours.cron.service';
import { PrismaService } from '../../prisma/prisma.service'; // Import trực tiếp Service giống các module khác

@Module({
  imports: [
    ScheduleModule.forRoot(),
  ],
  controllers: [ToursController],
  providers: [
    ToursService, 
    ToursMacroService, 
    ToursCronService,
    TourDocumentsService, // Đăng ký service tài liệu mới
    PrismaService, // Khai báo PrismaService ở đây để NestJS tự động inject
  ],
  exports: [ToursService, ToursMacroService, TourDocumentsService],
})
export class ToursModule {}