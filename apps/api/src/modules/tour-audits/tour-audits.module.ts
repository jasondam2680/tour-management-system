// apps/api/src/modules/tour-audits/tour-audits.module.ts
import { Module } from '@nestjs/common';
import {
  TourAuditController, TourAuditsController, AuditLinesController,
} from './tour-audits.controller';
import { TourAuditsService } from './tour-audits.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [TourAuditController, TourAuditsController, AuditLinesController],
  providers: [TourAuditsService, PrismaService],
  exports: [TourAuditsService],
})
export class TourAuditsModule {}
