import { Module } from '@nestjs/common';
import {
  GuidesController, GuideAdvancesController, GuideSettlementsController,
} from './guides.controller';
import { GuidesService } from './guides.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [GuidesController, GuideAdvancesController, GuideSettlementsController],
  providers: [GuidesService, PrismaService],
  exports: [GuidesService],
})
export class GuidesModule {}
